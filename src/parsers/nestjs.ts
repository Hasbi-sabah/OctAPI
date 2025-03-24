import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import * as vscode from "vscode";
import { Route } from "../types";
import { normalizeExplicitPaths } from "../utils/pathUtils";

export default async function extractNestJSRoutes(fileUri: vscode.Uri): Promise<Route[]> {
    if (!fileUri) {
        console.error("No file URI provided");
        return [];
    }
    const routesList: Route[] = [];
    const fileBytes = await vscode.workspace.fs.readFile(fileUri);
    const code = Buffer.from(fileBytes).toString("utf-8");
    try {
        const ast = parse(code, { sourceType: "module", plugins: ["typescript", "decorators-legacy"] });
        const filePath = fileUri.fsPath;

        traverse(ast, {
            // Track controller decorators to determine base paths
            ClassDeclaration(path) {
                const classDecorators = path.node.decorators || [];
                let basepath = "";

                classDecorators.forEach((decorator) => {
                    if (
                        t.isCallExpression(decorator.expression) &&
                        t.isIdentifier(decorator.expression.callee, { name: "Controller" }) &&
                        decorator.expression.arguments.length > 0 &&
                        t.isStringLiteral(decorator.expression.arguments[0])
                    ) {
                        basepath = decorator.expression.arguments[0].value;
                        if (!basepath.startsWith("/")) {
                            basepath = `/${basepath}`;
                        }
                    }
                });

                // Associate the base path with all routes in this class
                path.traverse({
                    ClassMethod(path) {
                        const methodDecorators = path.node.decorators || [];

                        methodDecorators.forEach((decorator) => {
                            if (
                                t.isCallExpression(decorator.expression) &&
                                t.isIdentifier(decorator.expression.callee) &&
                                ["Get", "Post", "Put", "Delete", "Patch"].includes(decorator.expression.callee.name)
                            ) {
                                const method = decorator.expression.callee.name.toUpperCase();
                                let pathValue = decorator.expression.arguments.length > 0 && t.isStringLiteral(decorator.expression.arguments[0])
                                    ? decorator.expression.arguments[0].value
                                    : "";

                                const { basePath, routePath, fullPath } = normalizeExplicitPaths(basepath, pathValue);

                                routesList.push({
                                    method,
                                    path: routePath,
                                    basePath,
                                    file: filePath,
                                    fileLine: decorator.loc?.start.line || 0,
                                    fullPath
                                });
                            }
                        });
                    },
                });
            },
        });
    } catch (error) {
        console.error(`Error parsing ${fileUri.fsPath}:`, error);
        return []
    }

    // console.log(routesList);
    return routesList;
}