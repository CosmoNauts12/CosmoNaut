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

describe("Regression: Auth & Headers Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    execSpy.mockResolvedValue({
      status: 200,
      body: "OK",
      headers: {},
      duration_ms: 10,
    });
  });

  test("generates basic auth header from credentials", async () => {
    render(
      <RequestPanel
        activeRequest={{ id: "1", name: "Auth Test", method: "GET" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    // Switch to Auth Tab
    fireEvent.click(screen.getByRole("button", { name: /^Auth$/i }));

    // Select Basic Auth
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "basic" } });

    // Fill credentials
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "secret123" } });

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(execSpy).toHaveBeenCalledTimes(1));

    const payload = execSpy.mock.calls[0][0];
    // "admin:secret123" basic auth encoded
    expect(payload.headers!["Authorization"]).toBe(`Basic ${btoa("admin:secret123")}`);
  });

  test("generates bearer token header", async () => {
    render(
      <RequestPanel
        activeRequest={{ id: "2", name: "Auth Test", method: "GET" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(/auth/i));
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "bearer" } });
    fireEvent.change(screen.getByPlaceholderText(/enter bearer token/i), { target: { value: "xyz-token" } });

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(execSpy).toHaveBeenCalledTimes(1));
    expect(execSpy.mock.calls[0][0].headers!["Authorization"]).toBe("Bearer xyz-token");
  });

  test("injects Content-Type automatically for POST requests with body", async () => {
    render(
      <RequestPanel
        activeRequest={{ id: "3", name: "Header Test", method: "POST" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /^Body$/i }));
    fireEvent.change(screen.getByPlaceholderText(/{ "key": "value" }/), { target: { value: '{"test":true}' } });

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(execSpy).toHaveBeenCalledTimes(1));
    expect(execSpy.mock.calls[0][0].headers!["Content-Type"]).toBe("application/json");
  });
});
