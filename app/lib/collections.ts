import { invoke } from "@tauri-apps/api/core";

export interface KVItem {
    key: string;
    value: string;
    enabled: boolean;
}

export interface AuthState {
    type: 'none' | 'bearer' | 'basic';
    bearerToken?: string;
    username?: string;
    password?: string;
}

export interface SavedRequest {
    id: string;
    name: string;
    method: string;
    url: string;
    params: KVItem[];
    auth: AuthState;
    headers: KVItem[];
    body: string;
}

export interface Collection {
    id: string;
    name: string;
    requests: SavedRequest[];
}

export async function saveCollectionsToDisk(userId: string, workspaceId: string, collections: Collection[]): Promise<void> {
    try {
        await invoke("save_collections", {
            userId,
            workspaceId,
            collections: JSON.stringify(collections)
        });
    } catch (error) {
        console.error("Failed to save collections:", error);
        throw error;
    }
}

export async function loadCollectionsFromDisk(userId: string, workspaceId: string): Promise<Collection[]> {
    try {
        const collections = await invoke<string>("load_collections", { userId, workspaceId });
        return JSON.parse(collections);
    } catch (error) {
        console.error("Failed to load collections:", error);
        return [];
    }
}
