import React, { useState } from "react";
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

describe("Regression: URL Edge Cases & Normalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    execSpy.mockResolvedValue({
      status: 200,
      body: "OK",
      headers: {},
      duration_ms: 50,
    });
  });

  test("handles trailing spaces and redundant method prefixes in URL", async () => {
    render(
      <RequestPanel
        activeRequest={{ id: "1", name: "URL Test", method: "GET" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    // Enter a messy URL
    const urlInput = screen.getByPlaceholderText(/enter request url/i);
    fireEvent.change(urlInput, { target: { value: "   GET http://api.messy.com/users   " } });

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(execSpy).toHaveBeenCalledTimes(1));

    const payload = execSpy.mock.calls[0][0];
    expect(payload.url).toBe("http://api.messy.com/users");
  });

  test("appends http:// if protocol is missing", async () => {
    render(
      <RequestPanel
        activeRequest={{ id: "2", name: "URL Test", method: "POST" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/enter request url/i), { target: { value: "localhost:8080/api" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(execSpy).toHaveBeenCalledTimes(1));
    expect(execSpy.mock.calls[0][0].url).toBe("https://localhost:8080/api");
  });

  test("merges UI params with existing URL query string correctly", async () => {
    render(
      <RequestPanel
        activeRequest={{ id: "3", name: "URL Test", method: "GET" }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/enter request url/i), { target: { value: "https://api.com/search?q=test" } });

    // The component defaults to having an empty row for params. Let's fill and enable it.
    const keys = screen.getAllByPlaceholderText("Key");
    const values = screen.getAllByPlaceholderText("Value");
    
    fireEvent.change(keys[0], { target: { value: "page" } });
    fireEvent.change(values[0], { target: { value: "2" } });

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(execSpy).toHaveBeenCalledTimes(1));
    
    const submittedUrl = execSpy.mock.calls[0][0].url;
    expect(submittedUrl).toContain("q=test");
    expect(submittedUrl).toContain("page=2");
  });
});
