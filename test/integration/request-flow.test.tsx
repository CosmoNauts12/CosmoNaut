import React, { useState } from "react";
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
  afterEach,
} from "vitest";

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

/*RESET*/

beforeEach(() => {
  vi.clearAllMocks();
});

/*MOCK PROVIDERS*/

const addToHistoryMock = vi.fn();

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

function TestWrapper() {
  const [response, setResponse] =
    useState<CosmoResponse | null>(null);
  const [executing, setExecuting] = useState(false);

  const activeRequest = {
    id: "1",
    name: "Test Request",
    method: "GET",
    url: "",
    params: [],
    headers: [],
    body: "",
    auth: { type: "none" },
  };

  return (
    <>
      <RequestPanel
        activeRequest={activeRequest}
        onResponse={(res) => setResponse(res)}
        onExecuting={(val) => setExecuting(val)}
      />

      <ResponsePanel
        response={response}
        isExecuting={executing}
      />
    </>
  );
}

/*TEST*/

describe("Integration: request flow", () => {
  beforeEach(() => {
    executeRequestMock.mockResolvedValue({
      status: 200,
      body: JSON.stringify({ message: "success" }),
      headers: {},
      duration_ms: 120,
    });
  });

  afterEach(() => {
    executeRequestMock.mockRestore();
  });

  test("user sends request → engine runs → response renders → history saved", async () => {
    render(<TestWrapper />);

    /* enter URL */
    fireEvent.change(
      screen.getByPlaceholderText(/enter request url/i),
      {
        target: {
          value:
            "jsonplaceholder.typicode.com/posts/1",
        },
      }
    );

    /* click SEND */
    fireEvent.click(
      screen.getByRole("button", { name: /send/i })
    );

    /* engine called */
    await waitFor(() =>
      expect(executeRequestMock).toHaveBeenCalledTimes(
        1
      )
    );

    /* status visible */
    await waitFor(() =>
      expect(
        screen.getByText(/200/i)
      ).toBeInTheDocument()
    );

    /* response body visible */
    await waitFor(() =>
      expect(
        screen.getAllByText((text) =>
          text.includes("success")
        )[0]
      ).toBeInTheDocument()
    );

    /* history side effect */
    await waitFor(() =>
      expect(addToHistoryMock).toHaveBeenCalledTimes(
        1
      )
    );
  });
});