import { Flow, FlowBlock } from "@/app/lib/collections";
import { executeRequest, CosmoResponse } from "@/app/components/RequestEngine";

export type FlowExecutionEvent =
    | { type: 'BLOCK_START', blockId: string }
    | { type: 'BLOCK_END', blockId: string, response: CosmoResponse, duration: number }
    | { type: 'BLOCK_ERROR', blockId: string, error: string }
    | { type: 'FLOW_START' }
    | { type: 'FLOW_END', summary: FlowExecutionSummary }
    | { type: 'FLOW_STOPPED', reason: string };

export interface FlowExecutionSummary {
    totalBlocks: number;
    executedBlocks: number;
    failedBlocks: number;
    totalDurationMs: number;
    success: boolean;
}

/**
 * FlowExecutor
 * Decoupled logic engine for sequential API flow execution.
 * Story 3.3 Compliance: Sequential runs, stop on failure, status tracking.
 */
export class FlowExecutor {
    private onEvent?: (event: FlowExecutionEvent) => void;
    private isRunning: boolean = false;

    constructor(callback?: (event: FlowExecutionEvent) => void) {
        this.onEvent = callback;
    }

    async execute(flow: Flow, isDemo: boolean = false): Promise<FlowExecutionSummary> {
        this.isRunning = true;
        this.onEvent?.({ type: 'FLOW_START' });

        const summary: FlowExecutionSummary = {
            totalBlocks: flow.blocks.length,
            executedBlocks: 0,
            failedBlocks: 0,
            totalDurationMs: 0,
            success: true
        };

        const startTime = Date.now();

        // Sort blocks by order to ensure sequential execution
        const sortedBlocks = [...flow.blocks].sort((a, b) => a.order - b.order);

        for (const block of sortedBlocks) {
            if (!this.isRunning) {
                this.onEvent?.({ type: 'FLOW_STOPPED', reason: 'User requested stop' });
                summary.success = false;
                break;
            }

            this.onEvent?.({ type: 'BLOCK_START', blockId: block.id });
            summary.executedBlocks++;

            try {
                const result = await this.executeBlock(block, isDemo);

                if (result.status >= 400 || result.error) {
                    summary.failedBlocks++;
                    this.onEvent?.({
                        type: 'BLOCK_END',
                        blockId: block.id,
                        response: result,
                        duration: result.duration_ms || 0
                    });

                    // Story 3.3: Stop execution on failure
                    summary.success = false;
                    this.onEvent?.({ type: 'FLOW_STOPPED', reason: `Block ${block.name} failed with status ${result.status}` });
                    break;
                }

                this.onEvent?.({
                    type: 'BLOCK_END',
                    blockId: block.id,
                    response: result,
                    duration: result.duration_ms || 0
                });

            } catch (error: any) {
                summary.failedBlocks++;
                summary.success = false;
                this.onEvent?.({
                    type: 'BLOCK_ERROR',
                    blockId: block.id,
                    error: error.message || 'Unknown error'
                });
                break;
            }
        }

        summary.totalDurationMs = Date.now() - startTime;
        this.isRunning = false;
        this.onEvent?.({ type: 'FLOW_END', summary });
        return summary;
    }

    private async executeBlock(block: FlowBlock, isDemo: boolean): Promise<CosmoResponse> {
        // Construct URL
        let targetUrl = block.url;
        const activeParams = block.params.filter(p => p.enabled && p.key.trim());
        if (activeParams.length > 0 && targetUrl) {
            try {
                const urlObj = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
                activeParams.forEach(p => urlObj.searchParams.append(p.key, p.value));
                targetUrl = urlObj.toString();
            } catch (e) { }
        }

        // Construct Headers
        const finalHeaders: Record<string, string> = {};
        block.headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
            finalHeaders[h.key] = h.value;
        });

        // Add default JSON header if body exists
        if (block.method !== 'GET' && block.body.trim()) {
            finalHeaders['Content-Type'] = 'application/json';
        }

        return await executeRequest({
            method: block.method,
            url: targetUrl || "https://jsonplaceholder.typicode.com/posts/1",
            headers: finalHeaders,
            body: block.method !== 'GET' ? block.body : undefined
        }, isDemo ? 'demo' : 'authenticated');
    }

    stop() {
        this.isRunning = false;
    }
}
