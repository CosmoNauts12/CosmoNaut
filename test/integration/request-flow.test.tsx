import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import RequestPanel from "@/app/components/RequestPanel";
import ResponsePanel from "@/app/components/ResponsePanel";
import * as engine from "@/app/components/RequestEngine";
import React, { useState } from "react";

/* ---------------- MOCK PROVIDERS ---------------- */

vi.mock("@/app/components/SettingsProvider", () => ({
  useSettings: () => ({ settings: {} }),
}));

vi.mock("@/app/components/AuthProvider", () => ({
  useAuth: () => ({ isDemo: false }),
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

/* ---------------- MOCK REQUEST ENGINE ---------------- */

vi.spyOn(engine, "executeRequest").mockResolvedValue({
  status: 200,
  body: JSON.stringify({ message: "success" }),
  headers: {},
  duration_ms: 120,
});

/* ---------------- TEST HARNESS ---------------- */

function TestWrapper() {
  const [response, setResponse] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  const activeRequest = {
    id: "1",
    name: "Test Request",
    method: "GET",
  };

  return (
    <>
      <RequestPanel
        activeRequest={activeRequest}
        onResponse={setResponse}
        onExecuting={setExecuting}
      />
      <ResponsePanel response={response} isExecuting={executing} />
    </>
  );
}

/* ---------------- TEST ---------------- */

test("integration: user sends request and sees response", async () => {
  render(<TestWrapper />);

  // URL input
  const urlInput = screen.getByPlaceholderText("Enter request URL");

  fireEvent.change(urlInput, {
    target: { value: "jsonplaceholder.typicode.com/posts/1" },
  });

  // Click SEND
  fireEvent.click(screen.getByText("Send"));

  // Wait for response to appear
  await waitFor(() => {
    expect(screen.getByText(/200/i)).toBeInTheDocument();
  });

  expect(screen.getByText(/success/i)).toBeInTheDocument();
});