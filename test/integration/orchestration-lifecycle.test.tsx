import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import RequestPanel from "@/app/components/RequestPanel";
import * as engine from "@/app/components/RequestEngine";

/* --- MOCK LAYER --- */
const addToHistoryMock = vi.fn();
const updateRequestMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/components/AuthProvider", () => ({
  useAuth: () => ({ isDemo: false }),
}));

vi.mock("@/app/components/SettingsProvider", () => ({
  useSettings: () => ({ settings: { lastWorkspaceId: "w1" } }),
}));

vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: () => ({
    collections: [{ id: "c1", name: "Production API", requests: [] }],
    currentRole: "write",
    addToHistory: addToHistoryMock,
    updateRequest: updateRequestMock,
  }),
}));

const execSpy = vi.spyOn(engine, "executeRequest");

describe("Mega-Integration: Advanced Request Orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("UH1 Flow: Complex JSON Post with Auth Normalization & Trace Recording", async () => {
    execSpy.mockResolvedValue({
      status: 201,
      body: JSON.stringify({ orderId: "999" }),
      headers: { "x-trace-id": "trace-9d82-ff12" },
      duration_ms: 240,
    });

    // We use a partial object that triggers the 'url' in activeRequest branch in RequestPanel.tsx
    const mockActiveRequest = {
      id: "req-1",
      name: "Create Order",
      method: "POST",
      url: "https://api.cosmonaut.io/v1/orders",
      params: [{ key: "debug", value: "true", enabled: true }],
      auth: { type: "bearer", bearerToken: "cosmo_secret_key" },
      headers: [{ key: "X-Custom-ID", value: "client-01", enabled: true }],
      body: JSON.stringify({ product: "Nebula-X" }),
      collectionId: "c1"
    };

    render(
      <RequestPanel
        activeRequest={mockActiveRequest as any}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    // 1. Target URL input by placeholder and change it to ensure normalization triggers
    const urlInput = screen.getByPlaceholderText(/enter request url/i);
    fireEvent.change(urlInput, { target: { value: "api.cosmonaut.io/v1/orders" } });

    // 2. Switch to Body Tab and update body
    fireEvent.click(screen.getByText(/body/i));
    const bodyInput = screen.getByPlaceholderText('{ "key": "value" }');
    fireEvent.change(bodyInput, { target: { value: '{"product":"Supernova"}' } });

    // 3. Trigger Send
    const sendButton = screen.getByRole("button", { name: /send/i });
    fireEvent.click(sendButton);

    // 4. Validate Orchestration
    await waitFor(() => {
      expect(execSpy).toHaveBeenCalledTimes(1);
    });

    const payload = execSpy.mock.calls[0][0];

    // Check URL Normalization (cleanUrl adds https:// + params logic appends ?debug=true)
    expect(payload.url).toBe("https://api.cosmonaut.io/v1/orders?debug=true");
    
    // Check Header Synthesis
    expect(payload.headers).toMatchObject({
      "Authorization": "Bearer cosmo_secret_key",
      "X-Custom-ID": "client-01",
      "Content-Type": "application/json"
    });

    // 5. Verify persistence of trace results
    await waitFor(() => {
      expect(addToHistoryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 201,
          duration_ms: 240
        })
      );
    });
  });

  test("Error Boundary: JSON Validation", async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(
      <RequestPanel
        activeRequest={{ id: "2", name: "Bad JSON", method: "POST" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(/body/i));
    const bodyInput = screen.getByPlaceholderText('{ "key": "value" }');
    fireEvent.change(bodyInput, { target: { value: '{"invalid": json}' } });

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(execSpy).not.toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith("Invalid JSON body payload.");
    
    alertMock.mockRestore();
  });
});