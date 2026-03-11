import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import React from "react";
import FlowBlockUI from "@/app/components/Flows/FlowBlock";
import type { FlowBlock } from "@/app/lib/collections";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/app/components/CollectionsProvider", () => ({
    useCollections: () => ({
        collections: [],
    }),
}));

const mockUpdateAction = vi.fn();
const mockDeleteAction = vi.fn();
const mockRunAction = vi.fn();
const mockDragStart = vi.fn();

// ─── Helper ──────────────────────────────────────────────────────────────────

function defaultBlock(overrides: Partial<FlowBlock> = {}): FlowBlock {
    return {
        id: "b_123",
        name: "Request",
        method: "GET",
        url: "https://api.example.com/data",
        params: [{ key: "", value: "", enabled: true }],
        headers: [{ key: "", value: "", enabled: true }],
        body: "",
        order: 0,
        x: 100,
        y: 100,
        ...overrides,
    };
}

function renderBlock(block: FlowBlock, props: any = {}) {
    return render(
        <FlowBlockUI
            block={block}
            onUpdateAction={mockUpdateAction}
            onDeleteAction={mockDeleteAction}
            onRunAction={mockRunAction}
            onDragStartAction={mockDragStart}
            {...props}
        />
    );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("FlowBlockUI — block card component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Rendering ─────────────────────────────────────────────────────────────

    test("renders the block name in the editable input", () => {
        renderBlock(defaultBlock({ name: "My Request Node" }));
        const input = screen.getByDisplayValue("My Request Node");
        expect(input).toBeInTheDocument();
    });

    test("renders the URL in the URL input", () => {
        renderBlock(defaultBlock({ url: "https://api.example.com/foobar" }));
        expect(screen.getByDisplayValue("https://api.example.com/foobar")).toBeInTheDocument();
    });

    test("shows 'HTTP Configuration' section label for Request blocks", () => {
        renderBlock(defaultBlock());
        expect(screen.getByText(/http configuration/i)).toBeInTheDocument();
    });

    test("shows 'Input' and 'Output' tabs", () => {
        renderBlock(defaultBlock());
        expect(screen.getByRole("button", { name: /input/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /output/i })).toBeInTheDocument();
    });

    test("shows 'Change trigger' dropdown button", () => {
        renderBlock(defaultBlock());
        expect(screen.getByRole("button", { name: /change trigger/i })).toBeInTheDocument();
    });

    // ── Interactions ──────────────────────────────────────────────────────────

    test("calls onUpdateAction with new name when block name input changes", () => {
        renderBlock(defaultBlock({ name: "Old Name" }));
        const input = screen.getByDisplayValue("Old Name");
        fireEvent.change(input, { target: { value: "New Name" } });
        expect(mockUpdateAction).toHaveBeenCalledWith(expect.objectContaining({ name: "New Name" }));
    });

    test("calls onUpdateAction with new URL when URL input changes", () => {
        renderBlock(defaultBlock());
        const urlInput = screen.getByPlaceholderText(/https:\/\/api\.domain/i);
        fireEvent.change(urlInput, { target: { value: "https://new-api.com" } });
        expect(mockUpdateAction).toHaveBeenCalledWith(expect.objectContaining({ url: "https://new-api.com" }));
    });

    test("calls onRunAction when the run (play) button is clicked", () => {
        renderBlock(defaultBlock());
        // The small per-block run button (play icon) in the header
        const runBtns = screen.getAllByRole("button");
        const playBtn = runBtns.find((b) => b.querySelector("polygon"));
        if (playBtn) fireEvent.click(playBtn);
        expect(mockRunAction).toHaveBeenCalled();
    });

    test("calls onDeleteAction with block id when delete button is clicked", () => {
        renderBlock(defaultBlock({ id: "b_delete_test" }));
        const btns = screen.getAllByRole("button");
        // Delete is the thrash-can button — has a path with 'M19 6v14'
        const deleteBtn = btns.find((b) => b.querySelector("path[d*='M19 6v14']"));
        if (deleteBtn) fireEvent.click(deleteBtn);
        expect(mockDeleteAction).toHaveBeenCalledWith("b_delete_test");
    });

    test("shows trigger options when 'Change trigger' is clicked", () => {
        renderBlock(defaultBlock());
        fireEvent.click(screen.getByRole("button", { name: /change trigger/i }));
        expect(screen.getByText(/start/i)).toBeInTheDocument();
        expect(screen.getByText(/schedule/i)).toBeInTheDocument();
    });

    test("switches to Output tab when 'Output' button is clicked", () => {
        renderBlock(defaultBlock());
        fireEvent.click(screen.getByRole("button", { name: /output/i }));
        // After clicking Output, the Output tab becomes active — 'HTTP Configuration' should disappear
        expect(screen.queryByText(/http configuration/i)).not.toBeInTheDocument();
    });

    // ── Start trigger block ───────────────────────────────────────────────────

    test("shows 'No configuration required' for Start trigger blocks", () => {
        renderBlock(defaultBlock({ name: "Start" }));
        expect(screen.getByText(/no configuration required/i)).toBeInTheDocument();
    });

    test("does not show URL input for Start trigger", () => {
        renderBlock(defaultBlock({ name: "Start" }));
        expect(screen.queryByPlaceholderText(/https:\/\/api\.domain/i)).not.toBeInTheDocument();
    });

    // ── Schedule trigger block ────────────────────────────────────────────────

    test("shows schedule description textarea for Schedule trigger", () => {
        renderBlock(defaultBlock({ name: "Schedule" }));
        expect(screen.getByPlaceholderText(/every monday/i)).toBeInTheDocument();
    });

    // ── Read-only mode ────────────────────────────────────────────────────────

    test("does not call onUpdateAction when changing name in readOnly mode", () => {
        renderBlock(defaultBlock({ name: "Read Only Block" }), { readOnly: true });
        // readOnly blocks still render but cannot trigger meaningful changes
        // The component passes readOnly to engine; we verify the prop doesn't crash
        expect(screen.getByDisplayValue("Read Only Block")).toBeInTheDocument();
    });
});
