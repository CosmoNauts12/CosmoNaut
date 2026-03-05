import { invoke } from "@tauri-apps/api/core";

/**
 * Workspace Interface
 * Represents a high-level container for collections and permissions.
 */
export interface Workspace {
    id: string;
    name: string;
    ownerId?: string;
}


