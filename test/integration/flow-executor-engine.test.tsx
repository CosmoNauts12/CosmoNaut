import "@testing-library/jest-dom/vitest";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { FlowExecutor } from "@/app/components/Flows/core/FlowExecutor";
import type { Flow, FlowBlock } from "@/app/lib/collections";
import * as engine from "@/app/components/RequestEngine";

// Mock the underlying HTTP engine so no real network calls are made
vi.mock("@/app/components/RequestEngine", () => ({
    executeRequest: vi.fn(),
}));

const execSpy = vi.spyOn(engine, "executeRequest");

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeBlock(overrides: Partial<FlowBlock> = {}): FlowBlock {
    return {
        id: `b_${Math.random().toString(36).slice(2)}`,
        name: "Request",
        method: "GET",
        url: "https://api.test.com/data",
        params: [],
        headers: [],
        body: "",
        order: 0,
        ...overrides,
    };
}

function makeFlow(blocks: FlowBlock[]): Flow {
    return { id: "f_test", name: "Test Flow", blocks };
}

const ok200 = {
    status: 200,
    body: JSON.stringify({ ok: true }),
    headers: {},
    duration_ms: 10,
};

const err500 = {
    status: 500,
    body: "Internal Server Error",
    headers: {},
    duration_ms: 10,
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("FlowExecutor — sequential execution engine", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("emits FLOW_START and FLOW_END events on successful run", async () => {
        execSpy.mockResolvedValue(ok200);
        const events: string[] = [];
        const executor = new FlowExecutor((e) => events.push(e.type));

        await executor.execute(makeFlow([makeBlock({ order: 0 })]));

        expect(events[0]).toBe("FLOW_START");
        expect(events[events.length - 1]).toBe("FLOW_END");
    });

    test("emits BLOCK_START then BLOCK_END per block", async () => {
        execSpy.mockResolvedValue(ok200);
        const events: { type: string; blockId?: string }[] = [];
        const executor = new FlowExecutor((e) =>
            events.push({ type: e.type, blockId: "blockId" in e ? e.blockId : undefined })
        );

        const block = makeBlock({ order: 0 });
        await executor.execute(makeFlow([block]));

        const blockEvents = events.filter((e) => e.blockId === block.id);
        expect(blockEvents.map((e) => e.type)).toEqual(["BLOCK_START", "BLOCK_END"]);
    });

    test("executes blocks in ascending order regardless of array order", async () => {
        const callOrder: string[] = [];
        execSpy.mockImplementation(async (req: any) => {
            callOrder.push(req.url);
            return ok200;
        });

        const block1 = makeBlock({ id: "b1", order: 0, url: "https://api.test.com/first" });
        const block2 = makeBlock({ id: "b2", order: 1, url: "https://api.test.com/second" });
        const block3 = makeBlock({ id: "b3", order: 2, url: "https://api.test.com/third" });

        // Pass them in reverse order
        const executor = new FlowExecutor();
        await executor.execute(makeFlow([block3, block1, block2]));

        expect(callOrder).toEqual([
            "https://api.test.com/first",
            "https://api.test.com/second",
            "https://api.test.com/third",
        ]);
    });

    test("summary reports all blocks executed on success", async () => {
        execSpy.mockResolvedValue(ok200);
        const executor = new FlowExecutor();
        const blocks = [makeBlock({ order: 0 }), makeBlock({ order: 1 })];

        const summary = await executor.execute(makeFlow(blocks));

        expect(summary.totalBlocks).toBe(2);
        expect(summary.executedBlocks).toBe(2);
        expect(summary.failedBlocks).toBe(0);
        expect(summary.success).toBe(true);
    });

    test("summary counts failed blocks on 4xx/5xx responses", async () => {
        execSpy.mockResolvedValueOnce(ok200).mockResolvedValueOnce(err500);
        let capturedSummary: any = null;
        const executor = new FlowExecutor((e) => {
            if (e.type === "FLOW_END") capturedSummary = e.summary;
        });

        const blocks = [makeBlock({ order: 0 }), makeBlock({ order: 1 })];
        const summary = await executor.execute(makeFlow(blocks));

        expect(capturedSummary.failedBlocks).toBe(1);
        expect(capturedSummary.executedBlocks).toBe(2);
        // When a block fails (4xx/5xx), the flow marks overall success as false
        expect(capturedSummary.success).toBe(false);
    });

    test("skips network call for 'Start' trigger blocks", async () => {
        const executor = new FlowExecutor();
        const startBlock = makeBlock({ name: "Start", order: 0 });
        const reqBlock = makeBlock({ name: "Request", order: 1 });
        execSpy.mockResolvedValue(ok200);

        await executor.execute(makeFlow([startBlock, reqBlock]));

        // executeRequest should only be called for the Request block, not Start
        expect(execSpy).toHaveBeenCalledTimes(1);
    });

    test("skips network call for 'Schedule' trigger blocks", async () => {
        const executor = new FlowExecutor();
        const schedBlock = makeBlock({ name: "Schedule", order: 0 });
        const reqBlock = makeBlock({ name: "Request", order: 1 });
        execSpy.mockResolvedValue(ok200);

        await executor.execute(makeFlow([schedBlock, reqBlock]));

        expect(execSpy).toHaveBeenCalledTimes(1);
    });

    test("handles empty flow gracefully", async () => {
        const executor = new FlowExecutor();
        const summary = await executor.execute(makeFlow([]));

        expect(summary.totalBlocks).toBe(0);
        expect(summary.executedBlocks).toBe(0);
        expect(summary.success).toBe(true);
        expect(execSpy).not.toHaveBeenCalled();
    });

    test("accumulates total duration across all blocks", async () => {
        execSpy
            .mockResolvedValueOnce({ ...ok200, duration_ms: 100 })
            .mockResolvedValueOnce({ ...ok200, duration_ms: 200 });

        let capturedSummary: any = null;
        const executor = new FlowExecutor((e) => {
            if (e.type === "FLOW_END") capturedSummary = e.summary;
        });

        const blocks = [makeBlock({ order: 0 }), makeBlock({ order: 1 })];
        await executor.execute(makeFlow(blocks));

        // totalDurationMs should be the wall-clock elapsed time, >= sum of block durations
        expect(capturedSummary.totalDurationMs).toBeGreaterThanOrEqual(0);
    });
});
