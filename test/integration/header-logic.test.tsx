import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import RequestPanel from "@/app/components/RequestPanel";
import * as engine from "@/app/components/RequestEngine";

vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: () => ({ collections: [], currentRole: "write", addToHistory: vi.fn() }),
}));
vi.mock("@/app/components/SettingsProvider", () => ({ useSettings: () => ({ settings: {} }) }));
vi.mock("@/app/components/AuthProvider", () => ({ useAuth: () => ({ isDemo: false }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("Integration: Auto Header Injection", () => {
  test("automatically adds Content-Type when a JSON body is present in POST", async () => {
    const execSpy = vi.spyOn(engine, "executeRequest").mockResolvedValue({
      status: 200, body: "{}", headers: {}, duration_ms: 10
    });

    render(
      <RequestPanel
        activeRequest={{
          id: "1", name: "POST Test", method: "POST",
          url: "https://api.com", params: [], headers: [],
          auth: { type: 'none' }, body: '{"foo":"bar"}',
          collectionId: "c1"
        } as any}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      const sentHeaders = execSpy.mock.calls[0][0].headers;
      expect(sentHeaders).toHaveProperty("Content-Type", "application/json");
    });
  });
});