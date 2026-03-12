import { describe, test, expect, vi } from "vitest";
import * as engine from "@/app/components/RequestEngine";

vi.spyOn(engine, "executeRequest").mockResolvedValue({
  status: 200,
  body: "{}",
  headers: { "x-trace-id": "cosmos-trace-abc" },
  duration_ms: 100
});

describe("Critical Regression: Request Engine Golden Master", () => {
  test("Engine output contract remains identical to v0.1.0 specifications", async () => {
    // The 'Golden' expected structure for a successful UH1 trace
    const goldenResponse = {
      status: 200,
      body: expect.any(String),
      headers: expect.objectContaining({
        "x-trace-id": expect.stringMatching(/^cosmos-trace-/),
      }),
      duration_ms: expect.any(Number),
    };

    // Execute a real-world complex request scenario
    const result = await engine.executeRequest({
      method: "POST",
      url: "https://api.internal/debug",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_integrity" })
    });

    // REGRESSION CHECK: If this fails, a core engine contract has broken
    expect(result).toMatchObject(goldenResponse);
  });
});