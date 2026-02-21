import "@testing-library/jest-dom/vitest";
import React, { useState } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";

import RequestPanel from "@/app/components/RequestPanel";
import * as engine from "@/app/components/RequestEngine";
import type { CosmoResponse } from "@/app/components/RequestEngine";

/*NEXT ROUTER MOCK*/

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
    addToHistory: addToHistoryMock,
    saveRequest: vi.fn(),
    updateRequest: vi.fn(),
    createCollection: vi.fn(),
  }),
}));

/*ENGINE*/

const executeRequestMock = vi.spyOn(engine, "executeRequest");

/*HARNESS*/

function TestHarness() {
  const [, setResponse] = useState<CosmoResponse | null>(null);
  const [, setExecuting] = useState(false);

  return (
    <RequestPanel
      activeRequest={{
        id: "1",
        name: "Norm Test",
        method: "POST",
      }}
      onResponse={setResponse}
      onExecuting={setExecuting}
    />
  );
}

/*TEST*/

describe("Integration: Request normalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    executeRequestMock.mockResolvedValue({
      status: 200,
      body: "{}",
      headers: {},
      duration_ms: 50,
    });
  });

  test("normalizes params into URL and persists history", async () => {
    render(<TestHarness />);

    /* enter URL */
    fireEvent.change(
      screen.getByPlaceholderText(/enter request url/i),
      { target: { value: "api.test.com/users" } }
    );

    /* params tab already active by default — no click needed */

    /* fill default param row */
    fireEvent.change(
      screen.getAllByPlaceholderText("Key")[0],
      { target: { value: "page" } }
    );

    fireEvent.change(
      screen.getAllByPlaceholderText("Value")[0],
      { target: { value: "1" } }
    );

    /* send */
    fireEvent.click(
      screen.getByRole("button", { name: /send/i })
    );

    await waitFor(() =>
      expect(executeRequestMock).toHaveBeenCalledTimes(1)
    );

    const payload =
      executeRequestMock.mock.calls[0][0];

    expect(payload.url).toContain(
      "https://api.test.com/users"
    );

    expect(payload.url).toContain("page=1");

    await waitFor(() =>
      expect(addToHistoryMock).toHaveBeenCalledTimes(1)
    );
  });
});