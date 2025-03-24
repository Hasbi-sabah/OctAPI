import { parse } from "@babel/parser"
import traverse from "@babel/traverse"
import * as t from "@babel/types"
import * as vscode from "vscode"
import { Route } from "../types"
import { normalizeExplicitPaths } from "../utils/pathUtils"

export default async function extractExpressRoutes(fileUri: vscode.Uri): Promise<Route[]> {
    if (!fileUri) {
        console.error("No file URI provided");
        return [];
    }
    const routesList: Route[] = []
    const routerVariables = new Set<string>()
    const nestedRouters = new Map<string, string>() // Stores mounted routers and their base paths

    const fileBytes = await vscode.workspace.fs.readFile(fileUri);
    const code = Buffer.from(fileBytes).toString("utf-8");
    try {
        const ast = parse(code, { sourceType: "module" })
        const filePath = fileUri.fsPath

        traverse(ast, {
            // Track all router variables (const router = express.Router();)
            VariableDeclarator(path) {
                if (
                    t.isCallExpression(path.node.init) &&
                    t.isMemberExpression(path.node.init.callee) &&
                    t.isIdentifier(path.node.init.callee.property, { name: "Router" })
                ) {
                    if (t.isIdentifier(path.node.id)) {
                        routerVariables.add(path.node.id.name)
                    }
                }
            },

            // Track `app.use('/basepath', someRouter)` to determine nested routers
            CallExpression(path) {
                const { node } = path

                // Case 1: Track `app.use('/basepath', router)`
                if (
                    t.isMemberExpression(node.callee) &&
                    t.isIdentifier(node.callee.property, { name: "use" }) &&
                    node.arguments.length >= 2 &&
                    t.isStringLiteral(node.arguments[0]) &&
                    t.isIdentifier(node.arguments[1])
                ) {
                    nestedRouters.set(node.arguments[1].name, node.arguments[0].value)
                    // console.log(`Detected mounted router: ${node.arguments[1].name} at ${node.arguments[0].value}`)
                }

                // Case 2: Track Direct Routes (app.METHOD(path, handler))
                if (
                    t.isMemberExpression(node.callee) &&
                    t.isIdentifier(node.callee.object, { name: "app" }) &&
                    t.isIdentifier(node.callee.property) &&
                    ["get", "post", "put", "delete", "patch"].includes(node.callee.property.name)
                ) {
                    const method = node.callee.property.name.toUpperCase();
                    const pathValue = t.isStringLiteral(node.arguments[0]) ? node.arguments[0].value : "";
                    
                    const { basePath, routePath, fullPath } = normalizeExplicitPaths("", pathValue);
                    
                    routesList.push({
                        method,
                        path: routePath,
                        basePath,
                        fullPath,
                        file: filePath,
                        fileLine: node.loc?.start.line || 0,
                    });
                }

                // Case 3: Track Router-based Routes (router.get(), router.post(), etc.)
                if (
                    t.isMemberExpression(node.callee) &&
                    t.isIdentifier(node.callee.object) &&
                    routerVariables.has(node.callee.object.name) &&
                    t.isIdentifier(node.callee.property) &&
                    ["get", "post", "put", "delete", "patch"].includes(node.callee.property.name)
                ) {
                    const method = node.callee.property.name.toUpperCase();
                    const pathValue = t.isStringLiteral(node.arguments[0]) ? node.arguments[0].value : "";
                    const parentRouter = node.callee.object.name;
                    const detectedBasePath = nestedRouters.get(parentRouter) || "";
                    
                    const { basePath, routePath, fullPath } = normalizeExplicitPaths(detectedBasePath, pathValue);
                    
                    routesList.push({
                        method,
                        path: routePath,
                        basePath,
                        fullPath,
                        file: filePath,
                        fileLine: node.loc?.start.line || 0,
                    });
                }
            },
        })
    } catch (error) {
        console.error(`Error parsing ${fileUri.fsPath}:`, error);
        return []
    }

    // console.log(routesList)
    return routesList
}