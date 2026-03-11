import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import RequestPanel from "@/app/components/RequestPanel";

vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: () => ({
    collections: [],
    currentRole: "read", // Simulating a collaborator with Read access
    saveRequest: vi.fn(),
    updateRequest: vi.fn(),
  }),
}));

vi.mock("@/app/components/SettingsProvider", () => ({ useSettings: () => ({ settings: {} }) }));
vi.mock("@/app/components/AuthProvider", () => ({ useAuth: () => ({ isDemo: false }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("Mega-Integration: Role Based Access Control", () => {
  test("Read-only role disables critical UI controls and prevents modification", () => {
    render(
      <RequestPanel
        activeRequest={{ id: "1", name: "Secure Request", method: "GET" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    // 1. Verify URL Input is disabled
    const urlInput = screen.getByPlaceholderText(/enter request url/i);
    expect(urlInput).toBeDisabled();

    // 2. Verify Method Select is disabled
    const methodSelect = screen.getByRole("combobox");
    expect(methodSelect).toBeDisabled();

    // 3. Verify 'Save' or 'Update' buttons are removed from DOM entirely per your logic
    const updateBtn = screen.queryByRole("button", { name: /update/i });
    const saveBtn = screen.queryByRole("button", { name: /save/i });
    
    expect(updateBtn).not.toBeInTheDocument();
    expect(saveBtn).not.toBeInTheDocument();
  });
});