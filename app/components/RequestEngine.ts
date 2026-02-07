import { invoke } from "@tauri-apps/api/core";

export interface CosmoRequest {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string;
}

export interface CosmoResponse {
    status: number;
    body: string;
    headers: Record<string, string>;
    duration_ms: number;
}

export async function executeRequest(request: CosmoRequest): Promise<CosmoResponse> {
    try {
        const response = await invoke<CosmoResponse>("execute_cosmo_request", { request });
        return response;
    } catch (error) {
        console.error("Request failed:", error);
        throw error;
    }
}
