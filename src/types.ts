import * as vscode from "vscode"

export interface Route {
    method: string
    path: string
    basePath: string
    file: string
    fileLine: number
    routeId?: string
    isStarred?: boolean
}

export interface Framework {
    name: string;
    function: (fileUri: vscode.Uri) => Promise<Route[]>;
    extensions: string[];
    includePatterns: string[];
}