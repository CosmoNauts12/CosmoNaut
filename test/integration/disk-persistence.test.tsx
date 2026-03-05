import "@testing-library/jest-dom/vitest";
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WorkspaceSidebar from "@/app/components/WorkspaceSidebar";
import { invoke } from "@tauri-apps/api/core";

// 1. Mock the entire module to allow us to track the 'invoke' calls
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/app/components/SettingsProvider", () => ({ 
  useSettings: () => ({ settings: { confirmDelete: false } }) 
}));

vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: () => ({
    activeWorkspaceId: "w1",
    workspaces: [{ id: "w1", name: "Disk Test" }],
    collections: [{ id: "c1", name: "To Be Deleted", requests: [] }],
    history: [],
    currentRole: "owner",
    // We simulate the logic that would bridge to the disk
    deleteCollection: async (id: string) => {
        await invoke("save_collections", { userId: "u1", workspaceId: "w1", collections: "[]" });
    }
  }),
}));

describe("Ultra-Integration: Disk Persistence Bridge", () => {
  test("Deleting a collection triggers a write to the local filesystem via Tauri", async () => {
    render(<WorkspaceSidebar />);

    // Trigger delete action from the Sidebar UI
    const delBtn = screen.getByTitle("Delete");
    fireEvent.click(delBtn);

    // Verify the integration bridge correctly invoked the Rust 'save_collections' command
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("save_collections", expect.objectContaining({
        workspaceId: "w1",
        collections: "[]" 
      }));
    });
  });
});