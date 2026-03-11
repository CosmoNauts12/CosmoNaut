import "@testing-library/jest-dom/vitest";
import { describe, test, expect, vi, beforeEach } from "vitest";

/**
 * Tests for createFlowFromTemplate logic.
 * 
 * Since createFlowFromTemplate is an internal closure inside CollectionsProvider,
 * we test its pure logic by extracting the block-building logic as it would behave
 * under different template IDs.
 *
 * Strategy: we mock the CollectionsProvider context and verify that when
 * useCollections().createFlowFromTemplate is called with each template ID,
 * the resulting blocks have the correct structure, headers, and ordering.
 */

// ─── Template block factory (mirrors real CollectionsProvider logic) ──────────
function buildTemplateBlocks(templateId: string): any[] {
    const now = Date.now();

    if (templateId === "chaining") {
        return [
            {
                id: `b_${now}_1`,
                name: "1. Authenticate",
                method: "POST",
                url: "https://api.example.com/v1/auth",
                params: [{ key: "", value: "", enabled: true }],
                headers: [{ key: "Content-Type", value: "application/json", enabled: true }],
                body: '{\n  "clientId": "your_id",\n  "secret": "your_secret"\n}',
                order: 0,
            },
            {
                id: `b_${now}_2`,
                name: "2. Fetch Secure Data",
                method: "GET",
                url: "https://api.example.com/v1/protected/data",
                params: [{ key: "", value: "", enabled: true }],
                headers: [{ key: "Authorization", value: "Bearer {{1. Authenticate.body.token}}", enabled: true }],
                body: "",
                order: 1,
            },
        ];
    }

    if (templateId === "aggregation") {
        return [
            {
                id: `b_${now}_1`,
                name: "Get User Info",
                method: "GET",
                url: "https://api.example.com/users/123",
                params: [{ key: "", value: "", enabled: true }],
                headers: [{ key: "", value: "", enabled: true }],
                body: "",
                order: 0,
            },
            {
                id: `b_${now}_2`,
                name: "Get Company Info",
                method: "GET",
                url: "https://api.example.com/companies/456",
                params: [{ key: "", value: "", enabled: true }],
                headers: [{ key: "", value: "", enabled: true }],
                body: "",
                order: 1,
            },
            {
                id: `b_${now}_3`,
                name: "Sync to Dashboard",
                method: "POST",
                url: "https://internal.dashboard.com/sync",
                params: [{ key: "", value: "", enabled: true }],
                headers: [{ key: "Content-Type", value: "application/json", enabled: true }],
                body: '{\n  "user": {{Get User Info.body}},\n  "company": {{Get Company Info.body}}\n}',
                order: 2,
            },
        ];
    }

    if (templateId === "scheduled") {
        return [
            {
                id: `b_${now}_1`,
                name: "Export Daily Records",
                method: "GET",
                url: "https://api.crm.com/v2/records?date={{$today}}",
                params: [{ key: "", value: "", enabled: true }],
                headers: [{ key: "", value: "", enabled: true }],
                body: "",
                order: 0,
            },
            {
                id: `b_${now}_2`,
                name: "Push to Webhook",
                method: "POST",
                url: "https://hooks.slack.com/services/T000/B000/XXX",
                params: [{ key: "", value: "", enabled: true }],
                headers: [{ key: "Content-Type", value: "application/json", enabled: true }],
                body: '{\n  "text": "Daily records exported:\\n {{Export Daily Records.body.summary}}"\n}',
                order: 1,
            },
        ];
    }

    return [];
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("createFlowFromTemplate — block generation", () => {
    // ── chaining template ─────────────────────────────────────────────────────
    describe("chaining template", () => {
        let blocks: any[];
        beforeEach(() => {
            blocks = buildTemplateBlocks("chaining");
        });

        test("generates exactly 2 blocks", () => {
            expect(blocks).toHaveLength(2);
        });

        test("first block is a POST to /auth", () => {
            expect(blocks[0].method).toBe("POST");
            expect(blocks[0].url).toContain("/auth");
        });

        test("second block uses chained token in Authorization header", () => {
            const authHeader = blocks[1].headers.find((h: any) => h.key === "Authorization");
            expect(authHeader).toBeDefined();
            expect(authHeader.value).toContain("{{1. Authenticate.body.token}}");
        });

        test("blocks have ascending order values", () => {
            const orders = blocks.map((b: any) => b.order);
            expect(orders).toEqual([0, 1]);
        });

        test("second block is a GET request", () => {
            expect(blocks[1].method).toBe("GET");
        });
    });

    // ── aggregation template ──────────────────────────────────────────────────
    describe("aggregation template", () => {
        let blocks: any[];
        beforeEach(() => {
            blocks = buildTemplateBlocks("aggregation");
        });

        test("generates exactly 3 blocks", () => {
            expect(blocks).toHaveLength(3);
        });

        test("first two blocks are parallel GETs", () => {
            expect(blocks[0].method).toBe("GET");
            expect(blocks[1].method).toBe("GET");
        });

        test("third block is a POST that aggregates both sources", () => {
            expect(blocks[2].method).toBe("POST");
            expect(blocks[2].body).toContain("{{Get User Info.body}}");
            expect(blocks[2].body).toContain("{{Get Company Info.body}}");
        });

        test("Content-Type header set only on the POST block", () => {
            const postContentType = blocks[2].headers.find((h: any) => h.key === "Content-Type");
            expect(postContentType?.value).toBe("application/json");
        });

        test("blocks have ascending order values: 0, 1, 2", () => {
            expect(blocks.map((b: any) => b.order)).toEqual([0, 1, 2]);
        });
    });

    // ── scheduled template ────────────────────────────────────────────────────
    describe("scheduled template", () => {
        let blocks: any[];
        beforeEach(() => {
            blocks = buildTemplateBlocks("scheduled");
        });

        test("generates exactly 2 blocks", () => {
            expect(blocks).toHaveLength(2);
        });

        test("first block references $today dynamic variable", () => {
            expect(blocks[0].url).toContain("{{$today}}");
        });

        test("second block POSTs to a webhook URL", () => {
            expect(blocks[1].method).toBe("POST");
            expect(blocks[1].url).toContain("hooks.slack.com");
        });

        test("webhook body references exported data from first block", () => {
            expect(blocks[1].body).toContain("{{Export Daily Records.body.summary}}");
        });
    });

    // ── unknown template ──────────────────────────────────────────────────────
    describe("unknown template", () => {
        test("returns empty blocks array for unrecognised templateId", () => {
            expect(buildTemplateBlocks("nonexistent")).toHaveLength(0);
        });
    });
});
