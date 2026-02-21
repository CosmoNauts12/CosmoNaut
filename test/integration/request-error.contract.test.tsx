import "@testing-library/jest-dom/vitest";
import React, { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";

import RequestPanel from "@/app/components/RequestPanel";
import ResponsePanel from "@/app/components/ResponsePanel";
import * as engine from "@/app/components/RequestEngine";
import type { CosmoResponse } from "@/app/components/RequestEngine";

/*router mock */
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

/*PROVIDERS*/

const addToHistoryMock = vi.fn();

vi.mock("@/app/components/AuthProvider", () => ({
  useAuth: () => ({ isDemo: false }),
}));

vi.mock("@/app/components/SettingsProvider", () => ({
  useSettings: () => ({ settings: {} }),
}));

vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: () => ({
    collections: [],
    currentRole: "write",
    saveRequest: vi.fn(),
    updateRequest: vi.fn(),
    createCollection: vi.fn(),
    addToHistory: addToHistoryMock,
  }),
}));

/*ENGINE*/

const execSpy = vi.spyOn(engine, "executeRequest");

/*HARNESS*/

function Wrapper() {
  const [response, setResponse] = useState<CosmoResponse | null>(null);
  const [executing, setExecuting] = useState(false);

  return (
    <>
      <RequestPanel
        activeRequest={{
          id: "1",
          name: "Error Test",
          method: "GET",
          url: "https://api.test.com",
          params: [],
          headers: [],
          auth: { type: "none" },
          body: "",
        }}
        onResponse={setResponse}
        onExecuting={setExecuting}
      />

      <ResponsePanel response={response} isExecuting={executing} />
    </>
  );
}

/*TEST*/

describe("Integration: Engine error contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    execSpy.mockResolvedValue({
      status: 0,
      body: "Network error",
      headers: {},
      duration_ms: 0,
    });
  });

  test("error → response lifecycle → history persisted", async () => {
    render(<Wrapper />);

    fireEvent.click(
      screen.getByRole("button", { name: /send/i })
    );

    /* loading */
    expect(
      screen.getByText(/analyzing signal/i)
    ).toBeInTheDocument();

    /* error shown */
    await waitFor(() =>
      expect(
        screen.getByText(/network error/i)
      ).toBeInTheDocument()
    );

    /* engine called */
    expect(execSpy).toHaveBeenCalledTimes(1);

    /* history saved */
    await waitFor(() =>
      expect(addToHistoryMock).toHaveBeenCalledTimes(1)
    );
  });
});