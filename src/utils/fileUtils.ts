import path from "path";
import * as vscode from "vscode"
import { frameworks } from "./frameworks";
import { Route } from "../types";

export async function getFilesRecursively(directoryUri: vscode.Uri, frameworkPatterns: string[], extensions: string[]): Promise<vscode.Uri[]> {
    const fileUris: vscode.Uri[] = [];
    const directoryUris: vscode.Uri[] = [];
    const blockedDirs = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '__tests__', '__mocks__']);

    try {
        const entries = await vscode.workspace.fs.readDirectory(directoryUri);

        for (const [name, type] of entries) {
            const fileUri = vscode.Uri.joinPath(directoryUri, name);
            const isDirectory = type === vscode.FileType.Directory;
            const ext = path.extname(name).toLowerCase();

            if (isDirectory) {
                // Skip blocked directories and special patterns
                if (!blockedDirs.has(name) &&
                    !name.startsWith("__") &&
                    !name.endsWith("__") &&
                    !name.startsWith('.') // Skip hidden directories
                ) {
                    directoryUris.push(fileUri);
                }
            } else {
                const filePath = fileUri.fsPath;
                const relativePath = vscode.workspace.asRelativePath(fileUri);

                // Skip if framework patterns exist and none match

                const matchesFrameworkPattern = frameworkPatterns
                ? frameworkPatterns.some(pattern => new RegExp(pattern.replace(/\*/g, '.*')).test(relativePath))
                : true;

                // Skip non-source files and common configs
                if (matchesFrameworkPattern &&
                    extensions.includes(ext) &&
                    !name.startsWith('.') && // Skip dotfiles
                    !name.endsWith('.d.ts') && // Skip TypeScript declaration files
                    !name.endsWith('.min.js') // Skip minified JS files
                ) {
                    console.log(`Found file: ${filePath}`);
                    fileUris.push(fileUri);
                }
            }
        }

        // Process directories in batches to prevent stack overflows
        while (directoryUris.length > 0) {
            const batch = directoryUris.splice(0, 10); // Process 10 dirs at a time
            const results = await Promise.all(
                batch.map(dir => getFilesRecursively(dir, frameworkPatterns, extensions))
            );
            fileUris.push(...results.flat());
        }
    } catch (error) {
        console.error(`Error reading directory ${directoryUri.fsPath}:`, error);
    }

    console.log("Files found:", fileUris.length);
    return fileUris;
}

export function openFileAtLine(file: string, line: number) {
    const fileUri = vscode.Uri.file(file)
    vscode.workspace.openTextDocument(fileUri).then((document) => {
        vscode.window.showTextDocument(document).then((editor) => {
            const range = new vscode.Range(line - 1, 0, line - 1, 0)
            editor.selection = new vscode.Selection(range.start, range.end)
            editor.revealRange(range)
        })
    })
}

export async function getFrameworkFiles(frameworkName: string) {
    const framework = frameworks.find(f => f.name === frameworkName);
    if (!framework) {
        console.error("Framework not found:", frameworkName);
        return [];
    }

    try {
        const config = vscode.workspace.getConfiguration("OctAPI");
        const routePath = config.get<string>("path", "./src/");
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
            console.error("No workspace folder found.");
            return [];
        }

        const directoryUri = vscode.Uri.joinPath(workspaceFolder.uri, routePath);
        const files = await getFilesRecursively(directoryUri, framework.includePatterns, framework.extensions);
        return files.filter(uri =>
            uri && uri.fsPath && // Add null check
            framework.extensions.includes(path.extname(uri.fsPath).toLowerCase())
        );
    } catch (error) {
        console.error("File retrieval failed:", error);
        return [];
    }
}

export async function parseSingleFile(uri: vscode.Uri): Promise<Route[]> {
    const config = vscode.workspace.getConfiguration("OctAPI");
    const frameworkName = config.get<string>("framework", "Express");
    const framework = frameworks.find(f => f.name === frameworkName);

    if (!framework) return [];

    // Check if file extension matches framework's supported extensions
    const ext = uri.fsPath.split('.').pop()?.toLowerCase() || '';
    if (!framework.extensions.includes(`.${ext}`)) return [];

    const routes = await framework.function(uri);
    return routes;
}