import { invoke } from "@tauri-apps/api/core";

/**
 * Workspace Interface
 * Represents a high-level container for collections and permissions.
 */
export interface Workspace {
    id: string;
    name: string;
}

/**
 * Persists workspace metadata to the local disk.
 * @param userId Unique user identifier.
 * @param workspaces Array of workspaces to save.
 */
export async function saveWorkspacesToDisk(userId: string, workspaces: Workspace[]): Promise<void> {
    try {
        await invoke("save_workspaces", {
            userId,
            workspaces: JSON.stringify(workspaces)
        });
    } catch (error) {
        console.error("Failed to save workspaces:", error);
        throw error;
    }
}

/**
 * Loads workspaces from the local disk. Returns a default workspace if none exist.
 * @param userId Unique user identifier.
 * @returns A promise resolving to an array of workspaces.
 */
export async function loadWorkspacesFromDisk(userId: string): Promise<Workspace[]> {
    try {
        const workspaces = await invoke<string>("load_workspaces", { userId });
        const parsed = JSON.parse(workspaces);
        if (parsed.length === 0) {
            // Default workspace if none exist
            return [{ id: "default", name: "My Workspace" }];
        }
        return parsed;
    } catch (error) {
        console.error("Failed to load workspaces:", error);
        return [{ id: "default", name: "My Workspace" }];
    }
}
