import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";

import RequestPanel from "@/app/components/RequestPanel";
import * as engine from "@/app/components/RequestEngine";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/components/AuthProvider", () => ({
  useAuth: () => ({ isDemo: false }),
}));

vi.mock("@/app/components/SettingsProvider", () => ({
  useSettings: () => ({ settings: {} }),
}));

vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: () => ({
    collections: [],
    saveRequest: vi.fn(),
    updateRequest: vi.fn(),
    createCollection: vi.fn(),
    addToHistory: vi.fn(),
    currentRole: "write",
  }),
}));

const execSpy = vi.spyOn(engine, "executeRequest");

describe("Regression: Body Format & Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    execSpy.mockResolvedValue({ status: 200, body: "OK", headers: {}, duration_ms: 50 });
    // Mock alert for validation test
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  test("blocks request if JSON body is invalid", async () => {
    render(
      <RequestPanel
        activeRequest={{ id: "1", name: "Body Test", method: "POST" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /^Body$/i }));
    fireEvent.change(screen.getByPlaceholderText(/{ "key": "value" }/), { target: { value: "{ invalid json " } });

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    // Should alert and not call engine
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Invalid JSON body payload."));
    expect(execSpy).not.toHaveBeenCalled();
  });

  test("beautifies valid JSON on click", async () => {
    render(
      <RequestPanel
        activeRequest={{ id: "2", name: "Body Test", method: "POST" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /^Body$/i }));
    const textarea = screen.getByPlaceholderText(/{ "key": "value" }/) as HTMLTextAreaElement;
    
    // Type unformatted json
    fireEvent.change(textarea, { target: { value: '{"a":1,"b":2}' } });

    // Click beautify
    fireEvent.click(screen.getByRole("button", { name: /beautify/i }));

    expect(textarea.value).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });
});
