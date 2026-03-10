import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import React from "react";
import FlowsLanding from "@/app/components/Flows/FlowsLanding";

/**
 * Tests for FlowsLanding — the empty-state landing page shown when
 * no flows exist. Props: onCreateFlow, onExploreTemplates.
 */

const mockOnCreateFlow = vi.fn();
const mockOnExploreTemplates = vi.fn();

function renderLanding() {
    return render(
        <FlowsLanding
            onCreateFlow={mockOnCreateFlow}
            onExploreTemplates={mockOnExploreTemplates}
        />
    );
}

describe("FlowsLanding — empty state page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Rendering ─────────────────────────────────────────────────────────────

    test("renders the 'Welcome to Flows' heading", () => {
        renderLanding();
        expect(screen.getByText(/welcome to flows/i)).toBeInTheDocument();
    });

    test("renders the descriptive subtitle text", () => {
        renderLanding();
        expect(screen.getByText(/visually design, test, and automate/i)).toBeInTheDocument();
    });

    test("renders the 'Create Your First Flow' primary button", () => {
        renderLanding();
        expect(
            screen.getByRole("button", { name: /create your first flow/i })
        ).toBeInTheDocument();
    });

    test("renders the 'Explore Templates' secondary button", () => {
        renderLanding();
        expect(
            screen.getByRole("button", { name: /explore templates/i })
        ).toBeInTheDocument();
    });

    test("renders all three feature highlight cards: Visualize, Automate, Debug", () => {
        renderLanding();
        // Use getAllByText since some words appear in both the subtitle and the feature cards
        expect(screen.getAllByText(/visualize/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/automate/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/debug/i).length).toBeGreaterThanOrEqual(1);
    });

    // ── Interactions ──────────────────────────────────────────────────────────

    test("clicking 'Create Your First Flow' fires onCreateFlow callback", () => {
        renderLanding();
        fireEvent.click(screen.getByRole("button", { name: /create your first flow/i }));
        expect(mockOnCreateFlow).toHaveBeenCalledTimes(1);
    });

    test("clicking 'Explore Templates' fires onExploreTemplates callback", () => {
        renderLanding();
        fireEvent.click(screen.getByRole("button", { name: /explore templates/i }));
        expect(mockOnExploreTemplates).toHaveBeenCalledTimes(1);
    });

    test("'Create Your First Flow' is not called more than once per click", () => {
        renderLanding();
        fireEvent.click(screen.getByRole("button", { name: /create your first flow/i }));
        expect(mockOnCreateFlow).toHaveBeenCalledTimes(1);
        expect(mockOnExploreTemplates).not.toHaveBeenCalled();
    });

    test("'Explore Templates' is not called more than once per click", () => {
        renderLanding();
        fireEvent.click(screen.getByRole("button", { name: /explore templates/i }));
        expect(mockOnExploreTemplates).toHaveBeenCalledTimes(1);
        expect(mockOnCreateFlow).not.toHaveBeenCalled();
    });

    // ── Feature card descriptions ─────────────────────────────────────────────

    test("Visualize card describes clear vertical flow", () => {
        renderLanding();
        expect(screen.getByText(/clear vertical flow/i)).toBeInTheDocument();
    });

    test("Automate card describes chaining requests", () => {
        renderLanding();
        expect(screen.getByText(/chain requests/i)).toBeInTheDocument();
    });

    test("Debug card describes failure identification", () => {
        renderLanding();
        expect(screen.getByText(/identify failures/i)).toBeInTheDocument();
    });
});
