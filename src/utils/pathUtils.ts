import path from "path";
import { Route } from "../types";

export function normalizeRouteComponents(
  fullPath: string,
  isPagesRouter: boolean
): { basePath: string; routePath: string } {
  const separator = path.sep;
  const apiRoot = isPagesRouter
    ? `${separator}pages${separator}api`
    : `${separator}app${separator}api`;

  const rawSegments = fullPath.split(apiRoot)[1]
    ?.split(separator)
    .filter(segment => {
      if (!segment) return false;
      if (segment.match(/\.(ts|js)x?$/)) return false;
      if (!isPagesRouter && segment === 'route') return false;
      return true;
    }) || [];

  const processedSegments = rawSegments
    .map(segment => {
      if (segment === 'index') return null;
      return segment
        .replace(/^\[(\.\.\.)?(\w+)\]$/, (_, isCatchAll, param) =>
          `:${param}${isCatchAll ? '*' : ''}`)
        .replace(/^\[\[(\.\.\.)?(\w+)\]\]$/, (_, isCatchAll, param) =>
          `:${param}${isCatchAll ? '*' : ''}?`);
    })
    .filter((segment): segment is string => segment !== null);

  const [routePath, ...baseSegments] = processedSegments.reverse();
  const basePath = baseSegments.reverse().join('/');

  return {
    basePath: normalizePathComponent(basePath),
    routePath: normalizePathComponent(routePath)
  };
}

export function normalizeExplicitPaths(
  controllerPath: string,
  methodPath: string
): { basePath: string; routePath: string, fullPath: string } {
  const normalize = (path: string) => {
    if (!path) return '/';
    path = path
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\/+/g, '/');
    if (!path.startsWith('/')) path = `/${path}`;
    return path
  };
  const basePath = normalize(controllerPath);
  const routePath = normalize(methodPath);
  const fullPath = [basePath, routePath].filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
  return {
    basePath,
    routePath,
    fullPath
  };
}

function normalizePathComponent(component: string): string {
  if (!component) return '';
  return `/${component}`
    .replace(/\/+/g, '/')
    .replace(/^\/\//, '/')
    .replace(/\/$/, '');
}

export function createRoute(
  method: string,
  filePath: string,
  fileLine: number,
  isPagesRouter: boolean
): Route {
  const { basePath, routePath } = normalizeRouteComponents(filePath, isPagesRouter);

  let fullPath = [basePath, routePath]
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');

  if (!fullPath.startsWith('/')) fullPath = `/${fullPath}`;
  if (fullPath === '') fullPath = '/';

  return {
    method,
    path: routePath,
    basePath,
    file: filePath,
    fileLine,
    fullPath
  };
}