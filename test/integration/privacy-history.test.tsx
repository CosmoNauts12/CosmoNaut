import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import RequestPanel from "@/app/components/RequestPanel";
import * as engine from "@/app/components/RequestEngine";

/* --- FULL MOCK LAYER --- */
const addToHistoryMock = vi.fn();

vi.mock("@/app/components/AuthProvider", () => ({
  useAuth: () => ({ isDemo: false }),
}));

vi.mock("@/app/components/SettingsProvider", () => ({
  useSettings: () => ({ settings: {} }), // Fixes the SettingsProvider error
}));

vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: () => ({
    collections: [],
    currentRole: "owner",
    addToHistory: addToHistoryMock,
    saveRequest: vi.fn(),
    updateRequest: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const execSpy = vi.spyOn(engine, "executeRequest");

describe("Ultra-Integration: Privacy-Aware Persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    execSpy.mockResolvedValue({
      status: 200,
      body: "{}",
      headers: {},
      duration_ms: 10,
    });
  });

  test("UH1 Goal: History integration correctly captures Auth metadata for replay", async () => {
    // Render with sensitive Bearer token metadata
    render(
      <RequestPanel
        activeRequest={{
          id: "1",
          name: "Privacy Test",
          method: "POST",
          url: "https://api.secure.com",
          params: [],
          headers: [],
          auth: { type: 'bearer', bearerToken: 'SECRET_JWT_TOKEN' },
          body: '{"data":"test"}',
        } as any}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    // Trigger Execution
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(execSpy).toHaveBeenCalled();
      // Integration check: Verify the persistence layer received the sensitive token
      // This is required for the "Proactive Engineering" and "Replay" features of UH1
      expect(addToHistoryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: expect.objectContaining({
            type: 'bearer',
            bearerToken: 'SECRET_JWT_TOKEN'
          })
        })
      );
    });
  });
});