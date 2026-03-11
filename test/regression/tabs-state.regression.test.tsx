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

describe("Regression: RequestBuilderTabs State Retention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    execSpy.mockResolvedValue({ status: 200, body: "OK", headers: {}, duration_ms: 50 });
  });

  test("retains configured state when switching between tabs", async () => {
    render(
      <RequestPanel
        activeRequest={{ id: "1", name: "Tab Test", method: "POST" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    // 1. Params Tab (Default)
    const paramsKeys = screen.getAllByPlaceholderText("Key");
    fireEvent.change(paramsKeys[0], { target: { value: "filter" } });

    // 2. Auth Tab
    fireEvent.click(screen.getByRole("button", { name: /^Auth$/i }));
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "bearer" } });
    fireEvent.change(screen.getByPlaceholderText(/enter bearer token/i), { target: { value: "my-token" } });

    // 3. Headers Tab
    fireEvent.click(screen.getByRole("button", { name: /^Headers$/i }));
    const headerKeys = screen.getAllByPlaceholderText("Key");
    fireEvent.change(headerKeys[0], { target: { value: "X-Custom" } });
    const headerVals = screen.getAllByPlaceholderText("Value");
    fireEvent.change(headerVals[0], { target: { value: "HeaderVal" } });

    // 4. Body Tab
    fireEvent.click(screen.getByRole("button", { name: /^Body$/i }));
    fireEvent.change(screen.getByPlaceholderText(/{ "key": "value" }/), { target: { value: '{"data":123}' } });

    // Send and verify EVERYTHING was collected across tabs
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(execSpy).toHaveBeenCalledTimes(1));

    const payload = execSpy.mock.calls[0][0];
    
    // Params
    expect(payload.url).toContain("filter=");
    
    // Headers & Auth
    expect(payload.headers!["Authorization"]).toBe("Bearer my-token");
    expect(payload.headers!["X-Custom"]).toBe("HeaderVal");
    
    // Body
    expect(payload.body).toBe('{"data":123}');
  });
});
