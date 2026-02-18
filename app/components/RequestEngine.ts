import { invoke } from "@tauri-apps/api/core";

export interface CosmoRequest {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string;
}

export interface CosmoError {
    error_type: 'NetworkError' | 'TimeoutError' | 'DnsError' | 'SslError' | 'InvalidUrl' | 'UnknownError';
    message: string;
}

export interface CosmoResponse {
    status: number;
    body: string;
    headers: Record<string, string>;
    duration_ms: number;
    error?: CosmoError;
}

/**
 * Request Engine
 * 
 * The bridge between Frontend (React) and Backend (Rust).
 * - Invokes Tauri commands to execute HTTP requests via `reqwest` in Rust.
 * - Handles error normalization/typing between Rust and TS.
 */
export async function executeRequest(request: CosmoRequest): Promise<CosmoResponse> {
    try {
        const response = await invoke<CosmoResponse>("execute_cosmo_request", { request });
        return response;
    } catch (error: any) {
        console.error("Execution failed:", error);

        // If it's already a structured error from Tauri
        if (error && typeof error === 'object' && 'error_type' in error) {
            return {
                status: 0,
                body: "",
                headers: {},
                duration_ms: 0,
                error: error as CosmoError
            };
        }

        // Fallback for unexpected failures
        return {
            status: 0,
            body: "",
            headers: {},
            duration_ms: 0,
            error: {
                error_type: 'UnknownError',
                message: error?.toString() || "An unhandled execution error occurred"
            }
        };
    }
}
