import path from "path";
import { Route } from "../types";

export function normalizeRouteComponents(
  fullPath: string,
  isPagesRouter: boolean
): { basePath: string; routePath: string } {
  const separator = path.sep; // Platform-specific path separator.
  
  // Define the root directory for API routes based on the router type.
  const apiRoot = isPagesRouter
    ? `${separator}pages${separator}api`
    : `${separator}app${separator}api`;

  // Extract the relative path after the API root.
  const relativePath = fullPath.split(apiRoot)[1];
  if (!relativePath) {
    // If no relative path exists, return default root paths.
    return { basePath: '', routePath: '/' }; 
  }

  // Split the relative path into segments and extract the file name.
  const segments = relativePath.split(separator).filter(Boolean);
  const fileName = segments.pop() || ''; // Last segment is the file name.
  const folderPath = segments.join('/'); // Remaining segments form the folder path.

  // Remove file extensions from the file name.
  const cleanFileName = fileName.replace(/\.(ts|js)x?$/, '');

  // Handle special cases for 'index' or 'route' files.
  if (cleanFileName === 'index' || cleanFileName === 'route') {
    return {
      basePath: isPagesRouter ? `/${folderPath}` : `/${segments.slice(0, -1).join('/')}`,
      routePath: isPagesRouter ? '/' : `/${segments.slice(-1)[0] || ''}`
    };
  }

  // Handle App Router-specific logic for nested folders.
  if (!isPagesRouter && folderPath) {
    const lastFolder = segments.pop() || ''; // Extract the last folder name.
    return {
      basePath: `/${segments.join('/')}`,
      routePath: `/${lastFolder}/${cleanFileName}`.replace(/\/+/g, '/')
    };
  }

  // Default case for other files.
  return {
    basePath: `/${folderPath}`,
    routePath: `/${cleanFileName}`
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