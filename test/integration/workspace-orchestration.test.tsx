import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import RequestPanel from "@/app/components/RequestPanel";

/* --- LIGHTWEIGHT MOCKS --- */
// We mock the modules instead of wrapping in real providers to save memory
vi.mock("@/app/components/AuthProvider", () => ({
  useAuth: () => ({ isDemo: false }),
}));

vi.mock("@/app/components/SettingsProvider", () => ({
  useSettings: () => ({ settings: { lastWorkspaceId: "w1" } }),
}));

// We manually control the role and state here to test the "Switching" logic
const mockCollectionsContext = {
  collections: [],
  currentRole: "owner",
  addToHistory: vi.fn(),
  updateRequest: vi.fn(),
  saveRequest: vi.fn(),
};

vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: () => mockCollectionsContext,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Ultra-Integration: Workspace Context Switching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Fast Switch: UI reacts to workspace role and flushes state", async () => {
    // Test the owner view first
    mockCollectionsContext.currentRole = "owner";

    const { rerender } = render(
      <RequestPanel 
        activeRequest={{ id: "new", name: "Default", method: "GET" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    const urlInput = screen.getByPlaceholderText(/enter request url/i);
    
    // 1. Verify rehydration from RequestPanel logic
    await waitFor(() => {
      expect(urlInput).toHaveValue("https://jsonplaceholder.typicode.com/posts/1");
    });

    // 2. Simulate Role Switch Integration (UH1 Requirement)
    // Change mock value and rerender to simulate workspace permission change
    mockCollectionsContext.currentRole = "read";
    
    rerender(
      <RequestPanel 
        activeRequest={{ id: "new", name: "Default", method: "GET" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    // 3. Assert the UI locked down immediately
    expect(urlInput).toBeDisabled();
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });
});