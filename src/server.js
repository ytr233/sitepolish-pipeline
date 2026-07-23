import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
};

function sendFile(response, filename) {
    if (!fs.existsSync(filename) || fs.statSync(filename).isDirectory()) {
        response.writeHead(404);
        response.end("Not found");
        return;
    }

    response.writeHead(200, {
        "Content-Type":
            contentTypes[path.extname(filename).toLowerCase()] ??
            "application/octet-stream",
    });
    fs.createReadStream(filename).pipe(response);
}

function safeSitePath(root, requestedPath) {
    const decoded = decodeURIComponent(requestedPath);
    const relative =
        decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
    const result = path.resolve(root, relative);
    return result.startsWith(path.resolve(root)) ? result : null;
}

function dashboard(runName) {
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Before and After | ${runName}</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; color: #172033; background: #eef1f6; font: 16px/1.5 system-ui, sans-serif; }
        header { padding: 0.8rem 1rem; color: white; background: #172033; }
        h1 { margin: 0; font-size: 1.15rem; }
        p { margin: 0.25rem 0 0; }
        main { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; padding: 0.75rem; }
        section { overflow: hidden; border: 2px solid #9aa6b8; border-radius: 0.5rem; background: white; }
        h2 { margin: 0; padding: 0.5rem 0.75rem; font-size: 1rem; background: #dfe5ed; }
        iframe { display: block; width: 100%; height: calc(100vh - 8.5rem); border: 0; }
        @media (max-width: 800px) { main { grid-template-columns: 1fr; } iframe { height: 70vh; } }
    </style>
</head>
<body>
    <header>
        <h1>SitePolish comparison: ${runName}</h1>
        <p>The baseline is preserved. The candidate contains only selected changes.</p>
    </header>
    <main>
        <section><h2>Before — untouched baseline</h2><iframe title="Baseline website" src="/before/"></iframe></section>
        <section><h2>After — candidate preview</h2><iframe title="Candidate website" src="/after/"></iframe></section>
    </main>
</body>
</html>`;
}

export function startComparisonServer(paths, port) {
    const server = http.createServer((request, response) => {
        const url = new URL(request.url, `http://${request.headers.host}`);
        if (url.pathname === "/") {
            response.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
            });
            response.end(dashboard(paths.name));
            return;
        }

        const before = url.pathname.startsWith("/before/");
        const after = url.pathname.startsWith("/after/");
        if (!before && !after) {
            response.writeHead(404);
            response.end("Not found");
            return;
        }

        const root = before ? paths.baseline : paths.candidate;
        const sitePath =
            url.pathname.replace(before ? "/before" : "/after", "") || "/";
        const filename = safeSitePath(root, sitePath);
        if (!filename) {
            response.writeHead(403);
            response.end("Forbidden");
            return;
        }

        sendFile(response, filename);
    });

    server.on("error", (error) => {
        console.error(`\nPreview server could not start: ${error.message}`);
        console.error("Try another port, for example: --port 8001\n");
        process.exitCode = 1;
    });

    server.listen(port, "127.0.0.1", () => {
        console.log(`\nComparison ready: http://localhost:${port}`);
        console.log(
            "Keep this Terminal window open. Press Control-C to stop the preview.\n",
        );
    });
}
