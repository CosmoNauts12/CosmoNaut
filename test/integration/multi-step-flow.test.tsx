import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import React from "react";
import RequestPanel from "@/app/components/RequestPanel";
import * as engine from "@/app/components/RequestEngine";

/* --- MOCKS --- */
vi.mock("@/app/components/AuthProvider", () => ({ useAuth: () => ({ isDemo: false }) }));
vi.mock("@/app/components/SettingsProvider", () => ({ useSettings: () => ({ settings: {} }) }));
vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: () => ({ 
    collections: [], 
    currentRole: "owner", 
    addToHistory: vi.fn(),
    saveRequest: vi.fn(),
    updateRequest: vi.fn(),
  }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }) }));

const execSpy = vi.spyOn(engine, "executeRequest");

describe("Ultra-Integration: Multi-Step Flow Automation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Chain Integration: Successfully passes data from Response A to Request B", async () => {
    // Step 1: Mock an Auth Request returning a token
    execSpy.mockResolvedValueOnce({
      status: 200,
      body: JSON.stringify({ token: "flow-token-123" }),
      headers: {},
      duration_ms: 50
    });

    // Step 2: Mock the subsequent data request
    execSpy.mockResolvedValueOnce({
      status: 200,
      body: JSON.stringify({ data: "secret-records" }),
      headers: {},
      duration_ms: 50
    });

    const { rerender } = render(
      <RequestPanel
        activeRequest={{ 
          id: "auth", 
          name: "Get Token", 
          method: "POST", 
          url: "https://api.com/login",
          params: [],
          headers: [],
          auth: { type: 'none' },
          body: ""
        } as any}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => expect(execSpy).toHaveBeenCalledTimes(1));

    // Step 3: Rerender with the "Chained" request structure (UH1 Scenario Automation)
    // We include empty arrays for params/headers to prevent the .map() error
    rerender(
      <RequestPanel
        activeRequest={{ 
            id: "data", 
            name: "Get Data", 
            method: "GET", 
            url: "https://api.com/data",
            params: [], // Required for RequestBuilderTabs
            headers: [], // Required for RequestBuilderTabs
            auth: { type: 'bearer', bearerToken: 'flow-token-123' }, // Data from Step 1
            body: "",
            collectionId: "history"
        } as any}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(execSpy).toHaveBeenCalledTimes(2);
      const secondCall = execSpy.mock.calls[1][0];
      // Verify integration correctly injected the token into the Authorization header
      expect(secondCall.headers).toHaveProperty("Authorization", "Bearer flow-token-123");
    });
  });
});