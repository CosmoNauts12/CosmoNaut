import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import RequestPanel from "@/app/components/RequestPanel";
import * as engine from "@/app/components/RequestEngine";

vi.mock("@/app/components/AuthProvider", () => ({ useAuth: () => ({ isDemo: false }) }));
vi.mock("@/app/components/SettingsProvider", () => ({ useSettings: () => ({ settings: {} }) }));
vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: () => ({ 
    collections: [], 
    currentRole: "owner", 
    addToHistory: vi.fn() 
  }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("Ultra-Integration: Scenario Replay Pipeline", () => {
  test("Replaying a history item restores complex Auth and Body telemetry", async () => {
    const execSpy = vi.spyOn(engine, "executeRequest").mockResolvedValue({
      status: 200, body: "{}", headers: {}, duration_ms: 10
    });

    // Simulate a captured historical request with Bearer Auth and JSON Body
    const historicalRequest = {
      id: "hist-123",
      name: "Captured Trace",
      method: "POST",
      url: "https://api.internal/trace",
      params: [],
      headers: [],
      auth: { type: "bearer", bearerToken: "replay-token-555" },
      body: '{"action":"replay"}',
      collectionId: "c1"
    };

    render(
      <RequestPanel
        activeRequest={historicalRequest as any}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    // 1. Verify rehydration of the URL and Method
    expect(screen.getByDisplayValue("https://api.internal/trace")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("POST");

    // 2. Verify Auth Tab rehydration
    fireEvent.click(screen.getByRole("button", { name: /^auth$/i }));
    expect(screen.getByPlaceholderText(/enter bearer token/i)).toHaveValue("replay-token-555");

    // 3. Verify Body Tab rehydration
    fireEvent.click(screen.getByRole("button", { name: /^body$/i }));
    expect(screen.getByPlaceholderText('{ "key": "value" }')).toHaveValue('{"action":"replay"}');

    // 4. Execute Replay
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
        const payload = execSpy.mock.calls[0][0];
        // Ensure the engine receives the exact historical headers
        expect(payload.headers).toHaveProperty("Authorization", "Bearer replay-token-555");
    });
  });
});