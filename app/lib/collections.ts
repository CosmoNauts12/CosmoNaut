import { invoke } from "@tauri-apps/api/core";

/**
 * Key-Value Item Interface
 * Used for params, headers, and other key-value pairs.
 */
export interface KVItem {
    key: string;
    value: string;
    enabled: boolean;
}

/**
 * Authentication State Interface
 * Defines the configuration for API authentication.
 */
export interface AuthState {
    type: 'none' | 'bearer' | 'basic';
    bearerToken?: string;
    username?: string;
    password?: string;
}

/**
 * Saved Request Interface
 * Represents a fully configured API request saved in a collection.
 */
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

/**
 * Collection Interface
 * A logical grouping of saved requests.
 */
export interface Collection {
    id: string;
    name: string;
    requests: SavedRequest[];
}

/**
 * Persists collections to the local filesystem via Tauri backend.
 * @param userId - The current user's ID.
 * @param workspaceId - The active workspace ID (scoping).
 * @param collections - The list of collections to save.
 */
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

/**
 * Loads collections from the local filesystem via Tauri backend.
 * @param userId - The current user's ID.
 * @param workspaceId - The active workspace ID.
 * @returns A promise resolving to the list of collections.
 */
export async function loadCollectionsFromDisk(userId: string, workspaceId: string): Promise<Collection[]> {
    try {
        const collections = await invoke<string>("load_collections", { userId, workspaceId });
        return JSON.parse(collections);
    } catch (error) {
        console.error("Failed to load collections:", error);
        return [];
    }
}
