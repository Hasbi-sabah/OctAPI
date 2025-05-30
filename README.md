![OctAPI Banner](https://raw.githubusercontent.com/Hasbi-sabah/OctAPI/master/resources/banner.png)

<table style="border-collapse: collapse; vertical-align: middle;">
  <tr>
    <td style="border: none;"><img src="https://raw.githubusercontent.com/Hasbi-sabah/OctAPI/master/resources/octapi_logo.png" width="50"></td>
    <td style="border: none; vertical-align: middle;"><h1 style="margin: 0;">OctAPI – API Route Explorer for VS Code</h1></td>
  </tr>
</table>

**Effortlessly visualize and navigate your API routes – directly in VS Code.**

---

### Demo

![OctAPI Demo](https://raw.githubusercontent.com/Hasbi-sabah/OctAPI/master/resources/octapi_demo.gif)

---

## Features

OctAPI provides a seamless way to explore and manage your API routes within Visual Studio Code. Here are its key features:

- **Smart Route Detection** – Scans all files within a user-defined directory to identify API routes.
- **Framework Support** – Works with Express.js, NestJS, Next.js, Koa, Flask, and FastAPI.
- **Smart File Watching & Caching** – Automatically detects file changes and updates routes in real time.
- **Jump to Code** – Clicking a route takes you directly to the exact line where it's defined.
- **Quick Copy with Prefixing** – Hover over a route to reveal a copy button, with an option to specify a route prefix.
- **Flexible Organization** – Toggle between grouping by basepath or HTTP method.
- **Visual Enhancements** – Routes feature distinct icons and colors for improved clarity and organization.
- **Native Sidebar Integration** – View all detected routes directly in VS Code’s sidebar.
- **Favorite Routes Management** – Star and persistently favorite frequently used routes, with an option to clear all favorites via a dedicated command.
- **Postman Export Command** – Export API routes as an importable Postman JSON collection, complete with method, full path, and path parameters, organized in appropriate subfolders.
- **Route Info Panel** – Click to reveal a detailed card showing extra information about a route.
- **Persistent Notes** – Add and manage notes for each route, saved across sessions.

---

## 🛠 Report Issues & Give Feedback

Have a suggestion or found a bug? Let us know!  
👉 [Submit feedback here](https://forms.gle/4BuPRUAzjA2JBpjd8)
 
OctAPI is constantly evolving. If your preferred framework isn't supported yet, open a [new issue on GitHub](https://github.com/Hasbi-sabah/OctAPI/issues/new?template=framework-request.yml) and let us know!

---

## Requirements

- **Visual Studio Code**: Ensure you have VS Code installed.
- **Supported Frameworks**: Express.js, NestJS, Next.js, Koa, Flask, and FastAPI.

---

## Extension Settings

This extension contributes the following settings:

- `octapi.path`: Define custom search paths for route detection.
- `octapi.framework`: Set the framework for route detection.
- `octapi.urlPrefix`: Specify a prefix to prepend when copying routes.

---

## Installation

You can install OctAPI from the following sources:

### Microsoft Marketplace

1. Visit the [OctAPI extension page on the Microsoft Marketplace](https://marketplace.visualstudio.com/items?itemName=HasbiSabah.octapi).
2. Click the **Install** button.
3. Follow the prompts to install the extension in VS Code.

### Open VSX

1. Visit the [OctAPI extension page on Open VSX](https://open-vsx.org/extension/Hasbi-Sabah/octapi).
2. Click the **Install** button.
3. Follow the prompts to install the extension.

### Manual Installation

1. Download the latest `.vsix` package from the [Releases](https://github.com/Hasbi-sabah/OctAPI/releases) page.
2. Open VS Code and navigate to **Extensions** (`Ctrl+Shift+X`).
3. Click the `...` menu and select **Install from VSIX...**.
4. Select the downloaded file and install it.
5. Reload VS Code if needed.

---

## Known Issues

- More language support is still in progress.
- Large codebases may experience slower scanning times.

---

## Release Notes

### v0.7.1 - 2025-05-12  
- **File Matching Fix**: Resolved an issue that caused root-level files to be skipped during scanning.

### v0.7.0 - 2025-04-22  
- **Route Info Panel**: Added a toggleable panel to view detailed route information.  
- **Persistent Notes**: Users can now add, edit, and delete notes for each route, stored persistently.  

### v0.6.0 - 2025-04-05  
- **Next.js Support**: Added support for Next.js API routes, including both app and pages routers.  
- **Webview Improvements**: Fixed infinite loading issues with a view readiness promise.  
- **File Path Normalization**: Ensured consistent route display across platforms, addressing issues on Windows.  

### v0.5.4 - 2025-03-24
- **Unified Path Handling**: Standardized route formatting across frameworks for consistency. 
- **Initial Render Infinite Loading**: Fixed an issue causing an infinite loading screen on first render.

### v0.5.3 - 2025-03-23
- **Fixes in Grouping & Copying**: Resolved an issue where grouping by basepath displayed the full path instead of just the path. Copying a route now correctly includes the full path.  

---

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repo.
2. Create a **feature branch** (`git checkout -b feature-name`).
3. Commit changes (`git commit -m "Describe feature"`).
4. Push to your branch (`git push origin feature-name`).
5. Open a **Pull Request**.

---

## License

Licensed under the **Apache 2.0 License**. See [LICENSE](LICENSE) for details.

---

## Privacy Policy

OctAPI runs entirely locally—no data collection, tracking, or telemetry. [Learn more](PRIVACY.md).  

---

## Contact

- **Author**: Hasbi Sabah
- **Email**: sabahhasbi00@gmail.com
- **GitHub**: [Hasbi-sabah](https://github.com/Hasbi-sabah)

---

**🚀 OctAPI – Stop searching, start coding.**
