INTEGRATION TESTING  COSMONAUT REQUEST LIFECYCLE


1. INTRODUCTION

This document describes the integration testing strategy implemented for the
CosmoNaut request execution system.

The goal of these tests is to validate the complete interaction between:

• RequestPanel (request builder UI)
• ResponsePanel (response renderer)
• Request normalization logic
• Rust request engine bridge
• History persistence layer
• Demo mode limiter

These tests simulate real user behaviour and verify the full execution flow
instead of testing isolated functions.


2. TESTING APPROACH


All tests are written using:

• Vitest
• React Testing Library
• jsdom test environment

The tests focus on behavioural validation:

✔ What the user does
✔ What the UI sends to the engine
✔ What the UI renders
✔ What side effects are produced


3. MOCKED MODULES

To isolate the request lifecycle, the following providers are mocked:

• AuthProvider
• SettingsProvider
• CollectionsProvider
• next/navigation

The request engine is spied using:

executeRequest → controlled success / failure / delay

This allows deterministic testing of async behaviour.


4. INTEGRATION TEST COVERAGE

4.1 REQUEST FLOW (Happy Path)

Validates the complete user journey:

1. User enters URL
2. User clicks SEND
3. Engine is executed
4. ResponsePanel displays:
   • HTTP status
   • response body
5. Request is stored in history

This ensures correct UI → engine → persistence integration.


4.2 REQUEST EXECUTION CONTRACT

Ensures the engine receives a fully normalized payload:

• method
• absolute URL
• headers
• JSON body (when applicable)

Also verifies:

• response rendering
• history persistence


4.3 REQUEST NORMALIZATION

Validates URL transformation logic:

• Automatic https:// injection
• Query parameter synthesis from Params tab
• Enabled-only parameter filtering

The test confirms that the engine receives the computed final URL,
not the raw user input.


4.4 LOADING LIFECYCLE

Validates async execution state:

Execution start:
→ loading state visible

Execution complete:
→ loading state removed
→ response rendered
→ history entry created

This prevents UI desynchronization during long requests.


4.5 ERROR CONTRACT

Simulates engine failure and verifies:

• UI does not crash
• Execution state resets correctly
• Error response is handled
• History is still persisted

This guarantees resilience of the request pipeline.


4.6 DEMO REQUEST LIMITER

Validates product behaviour for demo users:

• Request count stored in localStorage
• Limit enforcement
• Upgrade modal trigger
• Engine NOT executed after limit

This ensures correct feature gating.


5. WHAT THESE TESTS PROTECT

These integration tests lock the contracts between:

• UI state and request payload
• Engine response and UI rendering
• Execution lifecycle and loading indicators
• Request execution and history persistence

This prevents regressions when modifying:

• Request builder tabs
• Auth handling
• Header logic
• Body handling
• Role-based access control
