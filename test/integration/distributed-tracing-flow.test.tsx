import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import RequestPanel from "@/app/components/RequestPanel";
import * as engine from "@/app/components/RequestEngine";

const addToHistoryMock = vi.fn();
vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: () => ({ collections: [], currentRole: "write", addToHistory: addToHistoryMock }),
}));
vi.mock("@/app/components/SettingsProvider", () => ({ useSettings: () => ({ settings: {} }) }));
vi.mock("@/app/components/AuthProvider", () => ({ useAuth: () => ({ isDemo: false }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("Integration: Distributed Tracing Persistence", () => {
  test("persists engine-level errors and trace metadata to history", async () => {
    const execSpy = vi.spyOn(engine, "executeRequest").mockResolvedValue({
      status: 0,
      body: "",
      headers: {},
      duration_ms: 500,
      error: {
        error_type: 'TimeoutError',
        message: "Downstream service timed out at hop 3"
      }
    });

    render(
      <RequestPanel
        activeRequest={{ id: "1", name: "Trace Test", method: "GET" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      // Verify history receives the structured error from the engine
      expect(addToHistoryMock).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          error_type: 'TimeoutError'
        })
      }));
    });
    execSpy.mockRestore();
  });
});