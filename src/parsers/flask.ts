import * as path from "path";
import Parser from "tree-sitter";
import Python from "tree-sitter-python";
import * as vscode from "vscode";
import { Route } from "../types";
import { normalizeExplicitPaths } from "../utils/pathUtils";

const VALID_METHODS = new Set(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]);

export default async function extractFlaskRoutes(fileUri: vscode.Uri): Promise<Route[]> {
    if (!fileUri) {
        console.error("No file URI provided");
        return [];
    }
    const parser = createParser();
    const routesList: Route[] = [];
    const fileBytes = await vscode.workspace.fs.readFile(fileUri);
    const code = Buffer.from(fileBytes).toString("utf-8");
    const tree = parser.parse(code);
    processTree(tree, fileUri.fsPath, routesList);
    return routesList;
}

function createParser(): Parser {
    const parser = new Parser();
    parser.setLanguage(Python as unknown as Parser.Language);
    return parser;
}

function processTree(tree: Parser.Tree, filePath: string, routesList: Route[]): void {
    function traverse(node: Parser.SyntaxNode, basePath = "") {
        if (node.type === "decorated_definition") {
            const classDef = node.children.find(c => c.type === "class_definition");
            const functionDef = node.children.find(c => c.type === "function_definition");

            if (classDef) {
                processClassDefinition(node, basePath, filePath, routesList);
            } else if (functionDef) {
                processFunctionRoute(node, basePath, filePath, routesList);
            }
        }
        node.children.forEach(child => traverse(child, basePath));
    }

    traverse(tree.rootNode);
}

function processClassDefinition(
    node: Parser.SyntaxNode,
    basePath: string,
    filePath: string,
    routesList: Route[]
): void {
    const classDef = node.children.find(c => c.type === "class_definition");
    if (!classDef) return;

    const classBasePath = getDecoratedPath(node.children, basePath);
    const classBody = classDef.childForFieldName("body");

    classBody?.children.forEach(methodNode => {
        if (methodNode.type === "function_definition") {
            processClassMethod(methodNode, classBasePath, filePath, routesList);
        } else if (methodNode.type === "decorated_definition") {
            const funcDef = methodNode.children.find(c => c.type === "function_definition");
            if (funcDef) processClassMethod(funcDef, classBasePath, filePath, routesList);
        }
    });
}

function processFunctionRoute(
    node: Parser.SyntaxNode,
    basepath: string,
    filePath: string,
    routesList: Route[]
): void {
    const decorators = node.children.filter(c => c.type === "decorator");

    decorators.forEach(decorator => {
        const decoratorCall = decorator.children[1]?.text;
        if (!decoratorCall) return;

        const [decoratorName, pathArg] = parseDecoratorCall(decoratorCall);
        const { basePath, routePath, fullPath } = normalizeExplicitPaths(basepath, pathArg ? path.join(basepath, pathArg).replace(/\\/g, "/") : basepath);
        
        if (decoratorName.endsWith(".route")) {
            const methods = getMethodsFromDecorator(decoratorCall);
            methods.forEach(method => {
                routesList.push({
                    method,
                    path: routePath,
                    basePath,
                    fullPath,
                    file: filePath,
                    fileLine: decorator.startPosition.row + 1
                });
            });
        } else if (VALID_METHODS.has(decoratorName.split(".").pop()?.toUpperCase() || "")) {
            const method = decoratorName.split(".").pop()!.toUpperCase();
            routesList.push({
                method,
                path: routePath,
                basePath,
                fullPath,
                file: filePath,
                fileLine: decorator.startPosition.row + 1
            });
            
        }
    });
}

function processClassMethod(
    methodNode: Parser.SyntaxNode,
    classBasePath: string,
    filePath: string,
    routesList: Route[]
): void {
    const methodNameNode = methodNode.childForFieldName("name");
    if (!methodNameNode) return;

    const methodName = methodNameNode.text.toUpperCase();
    if (!VALID_METHODS.has(methodName)) return;
    const { basePath, routePath, fullPath } = normalizeExplicitPaths("", classBasePath);

    routesList.push({
        method: methodName,
        path: routePath,
        basePath,
        fullPath,
        file: filePath,
        fileLine: methodNode.startPosition.row + 1
    });
}

function getDecoratedPath(decorators: Parser.SyntaxNode[], basePath: string): string {
    return decorators.reduce((currentPath, decorator) => {
        const decoratorCall = decorator.children[1]?.text;
        if (!decoratorCall) return currentPath;

        const [decoratorName, pathArg] = parseDecoratorCall(decoratorCall);
        return decoratorName.endsWith(".route") && pathArg
            ? path.join(currentPath, pathArg).replace(/\\/g, "/")
            : currentPath;
    }, basePath);
}

function parseDecoratorCall(decoratorCall: string): [string, string?] {
    const decoratorName = decoratorCall.split("(")[0];
    const pathMatch = decoratorCall.match(/['"]([^'"]+)['"]/);
    return [decoratorName, pathMatch?.[1]];
}

function getMethodsFromDecorator(decoratorCall: string): string[] {
    const methodsMatch = decoratorCall.match(/methods\s*=\s*\[([^\]]+)\]/);
    if (!methodsMatch) return ["GET"];

    return methodsMatch[1]
        .split(",")
        .map(m => m.trim().replace(/['"]/g, "").toUpperCase())
        .filter(m => VALID_METHODS.has(m));
}