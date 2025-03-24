import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import * as vscode from 'vscode';
import { Route } from '../types';
import { normalizeExplicitPaths } from '../utils/pathUtils';

export default async function extractKoaRoutes(fileUri: vscode.Uri): Promise<Route[]> {
    if (!fileUri) {
        console.error("No file URI provided");
        return [];
    }
    const routesList: Route[] = [];
    const routerPrefixes = new Map<string, string>();

    const fileBytes = await vscode.workspace.fs.readFile(fileUri);
    const code = Buffer.from(fileBytes).toString("utf-8");
    try {
        const ast = parse(code, { sourceType: 'module', plugins: ['typescript'] });

        const filePath = fileUri.fsPath;

        traverse(ast, {
            CallExpression(path) {
                // Improved route method detection
                if (
                    t.isMemberExpression(path.node.callee) &&
                    t.isIdentifier(path.node.callee.object) &&
                    t.isIdentifier(path.node.callee.property) &&
                    ['get', 'post', 'put', 'delete', 'patch'].includes(path.node.callee.property.name)
                ) {
                    // Check if the first argument is a string (route path)
                    const firstArg = path.node.arguments[0];
                    if (t.isStringLiteral(firstArg)) {
                        // Check if the method is chained on a likely router-like method
                        const parentPath = path.parentPath;
                        const isLikelyRouterMethod = (
                            // Check for method chaining or direct router method
                            (t.isCallExpression(parentPath.node) &&
                                t.isMemberExpression(parentPath.node.callee) &&
                                t.isIdentifier(parentPath.node.callee.property) &&
                                ['use', 'routes', 'allowedMethods'].includes(parentPath.node.callee.property.name)) ||
                            (t.isVariableDeclarator(parentPath.node) &&
                                t.isIdentifier(parentPath.node.id)) ||
                            (t.isAssignmentExpression(parentPath.node))
                        );

                        if (isLikelyRouterMethod) {
                            const method = path.node.callee.property.name.toUpperCase();
                            const routePathValue = firstArg.value;
                            const routerVarName = path.node.callee.object.name;
                            const routerPrefix = routerPrefixes.get(routerVarName) || '';
                            const { basePath, routePath, fullPath } = normalizeExplicitPaths(routerPrefix || '', routePathValue);
                            routesList.push({
                                method,
                                path: routePath,
                                basePath,
                                fullPath,
                                file: filePath,
                                fileLine: path.node.loc?.start.line || 0
                            });
                        }
                    }
                }

                // Prefix detection remains the same
                if (
                    t.isMemberExpression(path.node.callee) &&
                    t.isIdentifier(path.node.callee.object) &&
                    t.isIdentifier(path.node.callee.property, { name: 'prefix' }) &&
                    t.isStringLiteral(path.node.arguments[0])
                ) {
                    const routerVarName = path.node.callee.object.name;
                    const prefixValue = path.node.arguments[0].value;
                    routerPrefixes.set(routerVarName, prefixValue);
                }
            },
        });
    } catch (error) {
        console.error('Error parsing file:', fileUri.fsPath, error);
        return [];
    }

    return routesList;
}