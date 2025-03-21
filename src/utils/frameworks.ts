import extractExpressRoutes from "../parsers/express";
import extractFastAPIRoutes from "../parsers/fastapi";
import extractFlaskRoutes from "../parsers/flask";
import extractKoaRoutes from "../parsers/koa";
import extractNestJSRoutes from "../parsers/nestjs";
import { Framework } from "../types";

export const frameworks: Framework[] = [
    {
        name: 'Express',
        function: extractExpressRoutes,
        extensions: ['.js', '.ts'],
        includePatterns: ['**/*']
    },
    {
        name: 'NestJS',
        function: extractNestJSRoutes,
        extensions: ['.js', '.ts'],
        includePatterns: ['**/*.controller.ts']
    },
    {
        name: 'Koa',
        function: extractKoaRoutes,
        extensions: ['.js', '.ts'],
        includePatterns: ['**/*']
    },
    {
        name: 'Flask',
        function: extractFlaskRoutes,
        extensions: ['.py'],
        includePatterns: ['**/*']
    },
    {
        name: 'FastAPI',
        function: extractFastAPIRoutes,
        extensions: ['.py'],
        includePatterns: ['**/*']
    }
]