import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import * as vscode from "vscode";
import { Route } from "../types";
import path from "path";
import { createRoute } from "../utils/pathUtils";

export default async function extractNextJSRoutes(fileUri: vscode.Uri): Promise<Route[]> {
  const routesList: Route[] = [];
  const filePath = fileUri.fsPath;

  const isPagesRouter = filePath.includes(`${path.sep}pages${path.sep}api`);
  const isAppRouter = filePath.includes(`${path.sep}app${path.sep}api`);

  if (!isPagesRouter && !isAppRouter) return [];

  const fileBytes = await vscode.workspace.fs.readFile(fileUri);
  const code = Buffer.from(fileBytes).toString("utf-8");

  try {
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["typescript"]
    });

    traverse(ast, {
      // Handle App Router exports (both function declarations and const exports)
      ExportNamedDeclaration(path) {
        const httpMethods = new Set(["GET", "POST", "PUT", "DELETE", "PATCH"]);

        // Case 1: export function GET() {}
        if (t.isFunctionDeclaration(path.node.declaration)) {
          const method = path.node.declaration.id?.name.toUpperCase();
          if (method && httpMethods.has(method)) {
            routesList.push(createRoute(
              method,
              filePath,
              path.node.loc?.start.line || 0,
              isPagesRouter
          ));
          }
        }

        // Case 2: export const GET = () => {}
        if (t.isVariableDeclaration(path.node.declaration)) {
          path.node.declaration.declarations.forEach(declarator => {
            if (t.isIdentifier(declarator.id) && httpMethods.has(declarator.id.name.toUpperCase())) {
              routesList.push(createRoute(
                declarator.id.name.toUpperCase(),
                filePath,
                path.node.loc?.start.line || 0,
                isPagesRouter
            ));
            }
          });
        }
      },

// Handle Pages Router method detection
ExportDefaultDeclaration(path) {
  if (isPagesRouter) {
      const methods = new Set<string>();
      let methodIdentifiers = new Set<string>(["req.method"]); // Track all aliases for req.method

      if (t.isFunctionDeclaration(path.node.declaration)) {
          const body = path.node.declaration.body;
          if (t.isBlockStatement(body)) {
              // First pass: Find all aliases for req.method
              body.body.forEach(node => {
                  if (t.isVariableDeclaration(node)) {
                      node.declarations.forEach(decl => {
                          // Handle destructuring: const { method } = req;
                          if (t.isObjectPattern(decl.id) &&
                              t.isIdentifier(decl.init, { name: "req" })) {
                              decl.id.properties.forEach(prop => {
                                  if (t.isObjectProperty(prop) &&
                                      t.isIdentifier(prop.key, { name: "method" }) &&
                                      t.isIdentifier(prop.value)) {
                                      methodIdentifiers.add(prop.value.name);
                                  }
                              });
                          }
                          // Handle direct assignment: const method = req.method;
                          else if (t.isIdentifier(decl.id) &&
                                  t.isMemberExpression(decl.init) &&
                                  t.isIdentifier(decl.init.object, { name: "req" }) &&
                                  t.isIdentifier(decl.init.property, { name: "method" })) {
                              methodIdentifiers.add(decl.id.name);
                          }
                      });
                  }
              });

              // Second pass: Analyze method usage
              const visitor = {
                  SwitchStatement(innerPath: NodePath<t.SwitchStatement>) {
                      const discriminant = innerPath.node.discriminant;
                      
                      // Check if switch uses a tracked method identifier
                      if (t.isIdentifier(discriminant) && 
                          methodIdentifiers.has(discriminant.name)) {
                          
                          innerPath.node.cases.forEach(switchCase => {
                              if (switchCase.test && t.isStringLiteral(switchCase.test)) {
                                  methods.add(switchCase.test.value.toUpperCase());
                              }
                          });
                      }
                  },

                  IfStatement(innerPath: NodePath<t.IfStatement>) {
                      const test = innerPath.node.test;
                      
                      // Handle comparisons using tracked identifiers
                      if (t.isBinaryExpression(test) &&
                          t.isIdentifier(test.left) && 
                          methodIdentifiers.has(test.left.name)) {
                          
                          if (t.isStringLiteral(test.right)) {
                              methods.add(test.right.value.toUpperCase());
                          }
                      }
                  }
              };

              traverse(body, visitor, path.scope);
          }
      }

      // Final method determination
      if (methods.size > 0) {
          methods.forEach(method => {
              routesList.push(createRoute(
                method,
                filePath,
                path.node.loc?.start.line || 0,
                isPagesRouter
            ));
          });
      } else {
          routesList.push(createRoute(
            "GET",
            filePath,
            path.node.loc?.start.line || 0,
            isPagesRouter
        ));
      }
  }
}

    });

  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return [];
  }

  return routesList;
}

