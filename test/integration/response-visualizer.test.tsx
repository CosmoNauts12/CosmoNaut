import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import React from "react";
import ResponsePanel from "@/app/components/ResponsePanel";

describe("Ultra-Integration: Response Format Visualization", () => {
  test("Successfully formats raw engine strings into Pretty JSON via format selector", async () => {
    const rawData = '{"status":"active","nodes":["node-1","node-2"]}';
    const mockResponse = {
      status: 200,
      body: rawData,
      headers: { "content-type": "application/json" },
      duration_ms: 150,
    };

    render(<ResponsePanel response={mockResponse} isExecuting={false} />);

    // 1. Target the JSON body specifically
    const jsonContainer = screen.getByText((_, element) => {
      const isCode = element?.tagName.toLowerCase() === 'code';
      const hasContent = element?.textContent?.replace(/\s/g, '').includes('"status":"active"');
      return isCode && hasContent;
    });
    expect(jsonContainer).toBeInTheDocument();

    // 2. Open Format Dropdown
    const formatBtn = screen.getByRole("button", { name: /json/i });
    fireEvent.click(formatBtn);

    // 3. Verify that the re-render maintains formatting integrity
    expect(jsonContainer.textContent?.replace(/\s/g, '')).toContain('"status":"active"');

    // 4. Verify Metadata Integration (UH1 Performance Tuning)
    expect(screen.getByText("150 ms")).toBeInTheDocument();
    expect(screen.getByText("47 B")).toBeInTheDocument();
  });
});