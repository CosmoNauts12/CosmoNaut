import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import RequestPanel from "@/app/components/RequestPanel";
import * as engine from "@/app/components/RequestEngine";

/* PROVIDER MOCKS */
vi.mock("@/app/components/AuthProvider", () => ({ useAuth: () => ({ isDemo: false }) }));
vi.mock("@/app/components/SettingsProvider", () => ({ useSettings: () => ({ settings: {} }) }));
vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: () => ({ collections: [], currentRole: "write", addToHistory: vi.fn() }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const execSpy = vi.spyOn(engine, "executeRequest");

describe("Integration: Auth to Header Conversion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    execSpy.mockResolvedValue({ status: 200, body: "{}", headers: {}, duration_ms: 10 });
  });

  test("converts Bearer Auth state into Authorization header for Engine", async () => {
    // We pass a request that has bearer auth defined in its metadata
    render(
      <RequestPanel
        activeRequest={{
          id: "test-1",
          name: "Auth Test",
          method: "GET",
          url: "https://api.test.com",
          params: [],
          headers: [],
          auth: { type: 'bearer', bearerToken: 'secret-123' },
          body: "",
          collectionId: "c1"
        }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    // Click Send
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(execSpy).toHaveBeenCalled();
      const sentRequest = execSpy.mock.calls[0][0];
      
      // Verify the logic in handleSend correctly injected the header
      expect(sentRequest.headers).toHaveProperty("Authorization", "Bearer secret-123");
    });
  });
});