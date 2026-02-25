import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlowExecutor } from './FlowExecutor';
import { Flow, FlowBlock } from '@/app/lib/collections';
import * as RequestEngine from '@/app/components/RequestEngine';

// Mock the RequestEngine
vi.mock('../components/RequestEngine', () => ({
    executeRequest: vi.fn()
}));

describe('FlowExecutor', () => {
    let executor: FlowExecutor;
    const mockCallback = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        executor = new FlowExecutor(mockCallback);
    });

    const createMockFlow = (blocks: Partial<FlowBlock>[]): Flow => ({
        id: 'test-flow',
        name: 'Test Flow',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        blocks: blocks.map((b, i) => ({
            id: `b${i}`,
            name: `Block ${i}`,
            method: 'GET',
            url: 'https://api.example.com',
            params: [],
            headers: [],
            body: '',
            order: i,
            ...b
        }))
    });

    it('executes blocks sequentially and completes on success', async () => {
        const flow = createMockFlow([{}, {}]);

        vi.mocked(RequestEngine.executeRequest).mockResolvedValue({
            status: 200,
            body: JSON.stringify({ success: true }),
            headers: {},
            duration_ms: 100
        });

        const summary = await executor.execute(flow);

        expect(summary.success).toBe(true);
        expect(summary.executedBlocks).toBe(2);
        expect(RequestEngine.executeRequest).toHaveBeenCalledTimes(2);

        // Verify events
        expect(mockCallback).toHaveBeenCalledWith({ type: 'FLOW_START' });
        expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ type: 'BLOCK_START', blockId: 'b0' }));
        expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ type: 'BLOCK_END', blockId: 'b1' }));
        expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ type: 'FLOW_END' }));
    });

    it('stops execution on block failure', async () => {
        const flow = createMockFlow([{}, {}]);

        // First block fails
        vi.mocked(RequestEngine.executeRequest).mockResolvedValueOnce({
            status: 500,
            error: { message: 'Server Error' }
        });

        const summary = await executor.execute(flow);

        expect(summary.success).toBe(false);
        expect(summary.executedBlocks).toBe(1);
        expect(summary.failedBlocks).toBe(1);
        expect(RequestEngine.executeRequest).toHaveBeenCalledTimes(1);

        expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
            type: 'FLOW_STOPPED',
            reason: expect.stringContaining('failed')
        }));
    });

    it('sorts blocks by order before execution', async () => {
        const flow = createMockFlow([
            { id: 'second', order: 1 },
            { id: 'first', order: 0 }
        ]);

        vi.mocked(RequestEngine.executeRequest).mockResolvedValue({ status: 200 });

        await executor.execute(flow);

        const calls = vi.mocked(RequestEngine.executeRequest).mock.calls;
        // Check if first block in the flow was executed first even if it was second in the array
        // The URL is same, so we check the internal ordering logic if needed, 
        // but here we can check the callbacks
        const blockStartCalls = mockCallback.mock.calls.filter(c => c[0].type === 'BLOCK_START');
        expect(blockStartCalls[0][0].blockId).toBe('first');
        expect(blockStartCalls[1][0].blockId).toBe('second');
    });
});
