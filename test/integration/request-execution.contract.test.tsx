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

/*ACTIVE REQUEST*/

const activeRequest = {
  id: "1",
  name: "Contract Test",
  method: "POST",
  url: "https://api.test.com/users",
  params: [],
  headers: [],
  body: "",
  auth: { type: "none" },
};

/*TEST HARNESS*/

function App() {
  const [response, setResponse] =
    useState<CosmoResponse | null>(null);
  const [executing, setExecuting] = useState(false);

  return (
    <>
      <RequestPanel
        activeRequest={activeRequest}
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

describe("Integration: Full request execution contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    executeRequestMock.mockResolvedValue({
      status: 200,
      body: JSON.stringify({ success: true }),
      headers: {
        "content-type": "application/json",
      },
      duration_ms: 120,
    });
  });

  test("normalizes → calls engine → renders response → persists history", async () => {
    render(<App />);

    /* switch to body tab */
    fireEvent.click(
      screen.getByText(/body/i)
    );

    const requestBody = { name: "Aravind" };

    fireEvent.change(
      screen.getByPlaceholderText(
        '{ "key": "value" }'
      ),
      {
        target: {
          value: JSON.stringify(requestBody),
        },
      }
    );

    /* send request */
    fireEvent.click(
      screen.getByRole("button", {
        name: /send/i,
      })
    );

    /* engine called */
    await waitFor(() =>
      expect(
        executeRequestMock
      ).toHaveBeenCalledTimes(1)
    );

    const payload =
      executeRequestMock.mock.calls[0][0];

    /* ENGINE CONTRACT */

    expect(payload.method).toBe("POST");
    expect(payload.url).toContain(
      "api.test.com"
    );
    expect(payload.body).toBe(
      JSON.stringify(requestBody)
    );

    /* RESPONSE RENDERED */

    await waitFor(() =>
      expect(
        screen.getByText((t) =>
          t.includes("success")
        )
      ).toBeInTheDocument()
    );

    /* HISTORY SIDE EFFECT */

    await waitFor(() =>
      expect(
        addToHistoryMock
      ).toHaveBeenCalledTimes(1)
    );
  });
});