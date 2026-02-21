import "@testing-library/jest-dom/vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import {
  describe,
  test,
  expect,
  vi,
  beforeEach,
} from "vitest";
import React, { useState } from "react";

import RequestPanel from "@/app/components/RequestPanel";
import ResponsePanel from "@/app/components/ResponsePanel";
import * as engine from "@/app/components/RequestEngine";
import type { CosmoResponse } from "@/app/components/RequestEngine";

/*NEXT NAVIGATION MOCK*/

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

/*CONTEXT MOCKS*/

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
    saveRequest: vi.fn(),
    updateRequest: vi.fn(),
    createCollection: vi.fn(),
    addToHistory: addToHistoryMock,
    currentRole: "write",
  }),
}));

/*ENGINE SPY*/

const executeRequestMock = vi.spyOn(
  engine,
  "executeRequest"
);

/*TEST HARNESS*/

function TestHarness() {
  const [response, setResponse] =
    useState<CosmoResponse | null>(null);
  const [executing, setExecuting] = useState(false);

  return (
    <>
      <RequestPanel
        activeRequest={{
          id: "1",
          name: "Test Request",
          method: "GET",
          url: "https://api.test.com",
          params: [],
          headers: [],
          body: "",
          auth: { type: "none" },
        }}
        onResponse={setResponse}
        onExecuting={setExecuting}
      />

      <ResponsePanel
        response={response}
        isExecuting={executing}
      />
    </>
  );
}

/*TEST*/

describe("Integration: Request loading lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    executeRequestMock.mockResolvedValue({
      status: 200,
      body: JSON.stringify({ ok: true }),
      headers: {},
      duration_ms: 150,
    });
  });

  test("Send → loading → response → history persisted → engine contract", async () => {
    render(<TestHarness />);

    fireEvent.click(
      screen.getByRole("button", { name: /send/i })
    );

    /* loading appears */
    expect(
      screen.getByText(/analyzing signal/i)
    ).toBeInTheDocument();

    /* engine called */
    await waitFor(() =>
      expect(
        executeRequestMock
      ).toHaveBeenCalledTimes(1)
    );

    const payload =
      executeRequestMock.mock.calls[0][0];

    /* response status */
    await waitFor(() =>
      expect(
        screen.getByText(/200/i)
      ).toBeInTheDocument()
    );

    /* response body */
    await waitFor(() =>
      expect(
        screen.getByText((t) =>
          t.includes('"ok": true')
        )
      ).toBeInTheDocument()
    );

    /* history persisted */
    await waitFor(() =>
      expect(
        addToHistoryMock
      ).toHaveBeenCalledTimes(1)
    );

    /* engine contract */
    expect(payload).toEqual(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("https://"),
      })
    );
  });
});