# Change Log

All notable changes to the "OctAPI" extension will be documented in this file.

## [0.5.2] - 2025-03-21
### Added  
- **Optimized File Scanning**: The extension now selectively scans relevant files based on predefined naming patterns for each framework. This reduces unnecessary processing, such as limiting NestJS scans to controller files instead of the entire directory.

## [0.5.1] - 2025-03-15  
### Fixed  
- **Infinite Loading on Empty Return**: Resolved an issue where the extension would get stuck in a loading state if an empty result was returned.  
- **Configuration Changes Not Applying**: Fixed a bug where changes to the extension's configuration were not being applied correctly without a restart.  

## [0.5.0] - 2025-03-14  
### Added  
- **File Watcher with Caching**: Implemented a file watcher that monitors API files for changes, reducing the need for full rescans. Includes a caching system for efficient route storage.  
- **Automated File Retrieval for Frameworks**: Introduced a utility to streamline file collection based on framework-specific structures.  

### Changed  
- **Improved File Filtering and Directory Handling**: Refactored file retrieval logic to enhance directory and file filtering, now processing directories in batches to prevent stack overflows.  
- **Updated Welcome Message**: The welcome message now encourages users to report unsupported frameworks to a newly added GitHub issue template.   

## [0.4.1] - 2025-03-10  
### Changed  
- **Postman Export Grouping**: Routes are now grouped into subfolders based on their basepath instead of all being placed in the root folder, making API organization clearer.

## [0.4.0] - 2025-03-05
### Added
- **Enhanced FastAPI Processing**: Improved FastAPI route processing to handle router prefixes and include them in the basepath, ensuring accurate detection of API routes.
- **Postman Export Command**: Added a command that exports API routes as an importable Postman JSON collection, including method, full path, and path parameters.

### Fixed
- **Koa Route Extraction**: Corrected method detection and prefix handling in Koa to prevent database calls from being mistaken as route definitions.
- **Copy Button Bug**: Fixed an issue where the copy button would disappear after being clicked.

## [0.3.0] - 2025-03-04
### Added
- **Starring/Favoriting Routes**: Added support for starring routes with persistence and toggle functionality, allowing users to mark frequently used routes.
- **Clear Favorite Routes Command**: Introduced a command to clear favorite routes, accompanied by UI updates and improved layout styling.

### Changed
- **Refactored Command Handling**: Simplified the command logic by removing unused commands for opening routes and copying route paths.

## [0.2.0] - 2025-02-25
### Added
- **FastAPI support**: Now detects API routes for FastAPI, making OctAPI more versatile for Python developers.
- **Custom route prefixing**: Users can now specify a route prefix when copying routes.
- **Distinct icon and color for PATCH routes**: PATCH routes now have unique color and icon for better visual distinction.

## [0.1.0] - 2025-02-20
### Added
- **Flask support**: Now detects API routes for Flask, including both decorator-based and class-based routes.

### Fixed
- **Smarter grouping toggle**: The "Group by Basepath" button now only appears when multiple basepaths exist.

## [0.0.3] - 2025-02-19
### Added
- **Copy route feature**: A copy button now appears when hovering over a route.
- **Feedback links**: Added links to a Google Form for reporting bugs and giving feedback.

### Fixed
- **File watching bug**: Route updates were previously triggered by file changes anywhere in the workspace. Now, only changes within the user-specified folder correctly trigger updates.

### Removed
- Unnecessary console logs for a cleaner development experience.

## [0.0.2] - 2025-02-15
### Changed
- Removed extra files to streamline the project.
- Cleaned up heavy, unused dependencies for a lighter extension.

## [0.0.1] - 2025-02-14
### Added
- Initial release of OctAPI.
- Supports Express.js, NestJS, and Koa frameworks.
- Automatic route detection and clickable routes.
