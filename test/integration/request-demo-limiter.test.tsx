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
  vi,
  expect,
  beforeEach,
  afterEach,
} from "vitest";

/*NEXT ROUTER MOCK*/
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

/*PROVIDER MOCKS*/

const addToHistory = vi.fn();

vi.mock("@/app/components/AuthProvider", () => ({
  useAuth: () => ({ isDemo: true }),
}));

vi.mock("@/app/components/SettingsProvider", () => ({
  useSettings: () => ({ settings: {} }),
}));

vi.mock("@/app/components/CollectionsProvider", () => ({
  useCollections: () => ({
    collections: [],
    currentRole: "write",
    addToHistory,
  }),
}));

/*IMPORTS*/

import RequestPanel from "@/app/components/RequestPanel";
import * as engine from "@/app/components/RequestEngine";

/*ENGINE SPY*/

const execSpy = vi.spyOn(engine, "executeRequest");

/*TEST*/

describe("Integration: Demo request flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    execSpy.mockResolvedValue({
      status: 200,
      body: "{}",
      headers: {},
      duration_ms: 20,
    });
  });

  afterEach(() => {
    execSpy.mockRestore();
  });

  test("demo user can execute request and it still hits engine", async () => {
    render(
      <RequestPanel
        activeRequest={{
          id: "1",
          name: "Demo",
          method: "GET",
          url: "https://jsonplaceholder.typicode.com/posts/1",
          params: [],
          headers: [],
          auth: { type: "none" },
          body: "",
        }}
        onResponse={vi.fn()}
        onExecuting={vi.fn()}
      />
    );

    /* click SEND */
    fireEvent.click(
      screen.getByRole("button", { name: /send/i })
    );

    /* engine must be called */
    await waitFor(() => {
      expect(execSpy).toHaveBeenCalledTimes(1);
    });

    /* history must be persisted */
    await waitFor(() => {
      expect(addToHistory).toHaveBeenCalledTimes(1);
    });
  });
});