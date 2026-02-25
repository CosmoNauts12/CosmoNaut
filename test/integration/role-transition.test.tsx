import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import React from "react";
import RequestPanel from "@/app/components/RequestPanel";
import { useCollections } from "@/app/components/CollectionsProvider";

// 1. Mock the specific provider hook
vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: vi.fn(),
}));

vi.mock("@/app/components/AuthProvider", () => ({
  useAuth: () => ({ isDemo: false }),
}));

vi.mock("@/app/components/SettingsProvider", () => ({
  useSettings: () => ({ settings: {} }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Ultra-Integration: Dynamic Role Transition", () => {
  const mockBase = { id: "1", name: "RBAC Test", method: "GET" };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test("UI immediately locks down when switching from 'owner' to 'read'", () => {
    // A. Mock the 'owner' role first
    vi.mocked(useCollections).mockReturnValue({
      currentRole: "owner",
      collections: [],
    } as any);

    const { rerender } = render(
      <RequestPanel activeRequest={mockBase} onResponse={vi.fn()} onExecuting={vi.fn()} />
    );

    // Verify input is enabled for owner
    const urlInput = screen.getByPlaceholderText(/enter request url/i);
    expect(urlInput).not.toBeDisabled();

    // B. Mock the 'read' role and rerender (simulating real-time permission change)
    vi.mocked(useCollections).mockReturnValue({
      currentRole: "read",
      collections: [],
    } as any);

    rerender(
      <RequestPanel activeRequest={mockBase} onResponse={vi.fn()} onExecuting={vi.fn()} />
    );

    // Verify input is now disabled for collaborator
    expect(urlInput).toBeDisabled();
  });
});