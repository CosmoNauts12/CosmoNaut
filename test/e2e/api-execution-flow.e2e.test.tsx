import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";

import RequestPanel from "@/app/components/RequestPanel";
import * as engine from "@/app/components/RequestEngine";

// --- Global Mocks ---
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

// Spy on the engine's core execution function
const execSpy = vi.spyOn(engine, "executeRequest");

describe("E2E: API Request Execution Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("1. Standard GET Request Flow", async () => {
    // Mock a successful backend response
    execSpy.mockResolvedValueOnce({
      status: 200,
      body: JSON.stringify({ message: "Success" }),
      headers: { "content-type": "application/json" },
      duration_ms: 120,
    });

    render(
      <RequestPanel
        activeRequest={{ id: "e2e-1", name: "GET Flow Test", method: "GET" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    // 1. Enter URL
    const urlInput = screen.getByPlaceholderText(/enter request url/i);
    fireEvent.change(urlInput, { target: { value: "https://api.example.com/data" } });

    // 2. Add a Query Parameter via UI Tab (Default selected tab)
    const paramKeys = screen.getAllByPlaceholderText("Key");
    const paramVals = screen.getAllByPlaceholderText("Value");
    fireEvent.change(paramKeys[0], { target: { value: "userId" } });
    fireEvent.change(paramVals[0], { target: { value: "123" } });

    // 3. Click Send
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    // 4. Assert Engine API Payload
    await waitFor(() => expect(execSpy).toHaveBeenCalledTimes(1));

    const dispatchedRequest = execSpy.mock.calls[0][0];
    expect(dispatchedRequest.method).toBe("GET");
    expect(dispatchedRequest.url).toBe("https://api.example.com/data?userId=123");

    // The component invokes onExecuting(true), executes request, then onExecuting(false) and onResponse()
    // but the scope of RequestPanel E2E focuses on the dispatch and handling the engine response internally.
  });

  test("2. POST Request with Headers and JSON Body", async () => {
    execSpy.mockResolvedValueOnce({
      status: 201,
      body: JSON.stringify({ id: 999, status: "created" }),
      headers: { "location": "/api/items/999" },
      duration_ms: 45,
    });

    render(
      <RequestPanel
        activeRequest={{ id: "e2e-2", name: "POST Flow Test", method: "POST" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    // 1. Enter URL
    fireEvent.change(screen.getByPlaceholderText(/enter request url/i), {
      target: { value: "https://api.example.com/items" },
    });

    // 2. Add Custom Headers
    fireEvent.click(screen.getByRole("button", { name: /^Headers$/i }));
    const headerKeys = screen.getAllByPlaceholderText("Key");
    const headerVals = screen.getAllByPlaceholderText("Value");
    fireEvent.change(headerKeys[0], { target: { value: "X-Idempotency-Key" } });
    fireEvent.change(headerVals[0], { target: { value: "idk-123" } });

    // 3. Add JSON Body
    fireEvent.click(screen.getByRole("button", { name: /^Body$/i }));
    const bodyInput = screen.getByPlaceholderText(/{ "key": "value" }/);
    const mockJsonBody = JSON.stringify({ name: "New Item", value: 10 });
    fireEvent.change(bodyInput, { target: { value: mockJsonBody } });

    // 4. Click Send
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(execSpy).toHaveBeenCalledTimes(1));

    const dispatchedRequest = execSpy.mock.calls[0][0];
    expect(dispatchedRequest.method).toBe("POST");
    expect(dispatchedRequest.url).toBe("https://api.example.com/items");
    
    // Auto-injected content-type should be present alongside custom headers
    expect(dispatchedRequest.headers!["X-Idempotency-Key"]).toBe("idk-123");
    expect(dispatchedRequest.headers!["Content-Type"]).toBe("application/json");

    expect(dispatchedRequest.body).toBe(mockJsonBody);
  });

  test("3. Error Handling - Network Failure Simulation", async () => {
    // Mock the backend returning a structured Tauri error
    execSpy.mockResolvedValueOnce({
      status: 0,
      body: "",
      headers: {},
      duration_ms: 0,
      error: {
        error_type: "NetworkError",
        message: "Failed to resolve Dns",
      },
    });

    const mockOnResponse = vi.fn();

    render(
      <RequestPanel
        activeRequest={{ id: "e2e-3", name: "Error Flow Test", method: "GET" }}
        onResponse={mockOnResponse}
        onExecuting={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/enter request url/i), {
      target: { value: "http://non-existent-domain.internal/foo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(execSpy).toHaveBeenCalledTimes(1));

    // Wait for the onResponse callback to be triggered in parent component to prove error propagated
    await waitFor(() => expect(mockOnResponse).toHaveBeenCalledWith(expect.objectContaining({
       error: expect.objectContaining({
           error_type: "NetworkError",
           message: "Failed to resolve Dns"
       })
    })));
  });
});
