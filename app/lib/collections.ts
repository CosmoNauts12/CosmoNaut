import { invoke } from "@tauri-apps/api/core";

/**
 * Represents a key-value pair used for parameters or headers.
 */
export interface KVItem {
    key: string;
    value: string;
    enabled: boolean;
}

/**
 * Represents the authentication state for a request.
 */
export interface AuthState {
    type: 'none' | 'bearer' | 'basic';
    bearerToken?: string;
    username?: string;
    password?: string;
}

/**
 * Represents a request saved by the user.
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
 * A group of saved requests.
 */
export interface Collection {
    id: string;
    name: string;
    requests: SavedRequest[];
}

/**
 * Persists collections to the local disk via Tauri.
 * @param userId Unique user identifier.
 * @param workspaceId Unique workspace identifier.
 * @param collections Array of collections to save.
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
 * Loads collections from the local disk via Tauri.
 * @param userId Unique user identifier.
 * @param workspaceId Unique workspace identifier.
 * @returns A promise resolving to an array of collections.
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
