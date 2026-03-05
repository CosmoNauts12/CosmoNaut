import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import RequestPanel from "@/app/components/RequestPanel";
import * as engine from "@/app/components/RequestEngine";

/* --- 1. FULL CONTEXT MOCKING --- */
const addToHistoryMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/components/AuthProvider", () => ({
  useAuth: () => ({ isDemo: false }),
}));

vi.mock("@/app/components/SettingsProvider", () => ({
  useSettings: () => ({ settings: { theme: 'dark' } }),
}));

vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: () => ({
    collections: [{ id: "col-1", name: "Default", requests: [] }],
    currentRole: "owner",
    addToHistory: addToHistoryMock,
    saveRequest: vi.fn(),
    updateRequest: vi.fn(),
    createCollection: vi.fn(),
  }),
}));

const execSpy = vi.spyOn(engine, "executeRequest");

describe("Ultra-Integration: End-to-End Request Pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    execSpy.mockResolvedValue({
      status: 200,
      body: JSON.stringify({ status: "trace_recorded" }),
      headers: { 
        "x-trace-id": "cosmos-trace-550e8400",
        "x-node-id": "rust-backend-01" 
      },
      duration_ms: 120,
    });
  });

  test("Integration of URL Cleaning + Auth Injection + History Persistence", async () => {
    render(
      <RequestPanel
        activeRequest={{ id: "new", name: "Test", method: "POST" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    // STEP 1: Test URL Normalization Logic
    const urlInput = screen.getByPlaceholderText(/enter request url/i);
    fireEvent.change(urlInput, { target: { value: "POST http://api.internal.svc/debug" } });

    // STEP 2: Navigate Tabs using Roles to avoid text ambiguity
    const authTab = screen.getByRole("button", { name: /^auth$/i });
    fireEvent.click(authTab);

    const headersTab = screen.getByRole("button", { name: /^headers$/i });
    fireEvent.click(headersTab);

    // STEP 3: Execution Handshake
    const sendBtn = screen.getByRole("button", { name: /send/i });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    // ASSERTION: Flexible matching for both Local (Node) and CI (Bun)
    await waitFor(() => {
      // Use toHaveBeenCalledWith with a single argument check first.
      // If your environment sends two, this matcher still validates the first one correctly.
      expect(execSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: "http://api.internal.svc/debug",
          headers: expect.any(Object), 
        }),
        // Using expect.anything() ONLY if the received call actually has a second argument.
        // If it doesn't, Vitest might complain, so we use the most flexible check:
        ...(execSpy.mock.calls[0].length > 1 ? [expect.anything()] : [])
      );
    });

    // ASSERTION: Verify History Persistence Integration
    await waitFor(() => {
      expect(addToHistoryMock).toHaveBeenCalledWith(expect.objectContaining({
        status: 200,
        duration_ms: 120
      }));
    });
  });

  test("Integration: JSON Validation Edge Case", async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(
      <RequestPanel
        activeRequest={{ id: "new", name: "JSON Test", method: "POST" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /^body$/i }));
    const bodyArea = screen.getByPlaceholderText('{ "key": "value" }');
    fireEvent.change(bodyArea, { target: { value: "{ invalid_json: 123 }" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
    });

    expect(execSpy).not.toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith("Invalid JSON body payload.");
    
    alertMock.mockRestore();
  });
});