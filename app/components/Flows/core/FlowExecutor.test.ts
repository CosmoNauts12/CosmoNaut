import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * vi.hoisted ensures the mock function is created BEFORE modules are imported.
 * This is required because vi.mock() factories are hoisted to the top of the
 * file by vitest, running before any import statements. Without vi.hoisted,
 * vi.mocked(executeRequest).mockResolvedValue is not a function at runtime.
 */
const mockExecuteRequest = vi.hoisted(() => vi.fn());

vi.mock('@/app/components/RequestEngine', () => ({
    executeRequest: mockExecuteRequest
}));

import { FlowExecutor } from './FlowExecutor';
import { Flow, FlowBlock } from '@/app/lib/collections';

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

        mockExecuteRequest.mockResolvedValue({
            status: 200,
            body: JSON.stringify({ success: true }),
            headers: {},
            duration_ms: 100
        });

        const summary = await executor.execute(flow);

        expect(summary.success).toBe(true);
        expect(summary.executedBlocks).toBe(2);
        expect(mockExecuteRequest).toHaveBeenCalledTimes(2);

        // Verify events
        expect(mockCallback).toHaveBeenCalledWith({ type: 'FLOW_START' });
        expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ type: 'BLOCK_START', blockId: 'b0' }));
        expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ type: 'BLOCK_END', blockId: 'b1' }));
        expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ type: 'FLOW_END' }));
    });

    it('stops execution on block failure', async () => {
        const flow = createMockFlow([{}, {}]);

        // First block fails
        mockExecuteRequest.mockResolvedValueOnce({
            status: 500,
            error: {
                error_type: 'UnknownError',
                message: 'Server Error'
            } as any
        });

        const summary = await executor.execute(flow);

        expect(summary.success).toBe(false);
        expect(summary.executedBlocks).toBe(1);
        expect(summary.failedBlocks).toBe(1);
        expect(mockExecuteRequest).toHaveBeenCalledTimes(1);

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

        mockExecuteRequest.mockResolvedValue({
            status: 200,
            body: "{}",
            headers: {},
            duration_ms: 10
        });

        await executor.execute(flow);

        // Check that 'first' (order:0) was executed before 'second' (order:1)
        const blockStartCalls = mockCallback.mock.calls.filter(c => c[0].type === 'BLOCK_START');
        expect(blockStartCalls[0][0].blockId).toBe('first');
        expect(blockStartCalls[1][0].blockId).toBe('second');
    });
});
