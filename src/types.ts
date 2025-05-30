import * as vscode from "vscode"

export interface Route {
    method: string
    path: string
    basePath: string
    file: string
    fileLine: number
    fullPath: string
    routeId?: string
    isStarred?: boolean
    notes?: string
}

export interface Framework {
    name: string;
    function: (fileUri: vscode.Uri) => Promise<Route[]>;
    extensions: string[];
    includePatterns: string[];
}