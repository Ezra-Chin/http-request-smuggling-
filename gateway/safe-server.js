const net = require("net");

const PORT = 5050;
const BACKEND_HOST = "localhost";
const BACKEND_PORT = 5100;

function parseHeaders(headerLines) {
    const headers = {};

    for (const line of headerLines) {
        const index = line.indexOf(":");

        if (index === -1) {
            continue;
        }

        const key = line.slice(0, index).trim().toLowerCase();
        const value = line.slice(index + 1).trim();

        headers[key] = value;
    }

    return headers;
}

function readChunkedEnd(buffer, start) {
    let pos = start;

    while (true) {
        const lineEnd = buffer.indexOf("\r\n", pos);

        if (lineEnd === -1) {
            return null;
        }

        const size = parseInt(
            buffer.slice(pos, lineEnd).toString("latin1").trim(),
            16
        );

        if (Number.isNaN(size)) {
            return null;
        }

        pos = lineEnd + 2;

        if (size === 0) {
            if (buffer.length < pos + 2) {
                return null;
            }

            return pos + 2;
        }

        if (buffer.length < pos + size + 2) {
            return null;
        }

        pos = pos + size + 2;
    }
}

const server = net.createServer((client) => {
    const backend = net.connect(BACKEND_PORT, BACKEND_HOST);

    let buffer = Buffer.alloc(0);

    backend.on("data", (data) => client.write(data));
    backend.on("error", () => client.destroy());
    backend.on("close", () => client.end());

    client.on("data", (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);

        while (true) {
            const headerEnd = buffer.indexOf("\r\n\r\n");

            if (headerEnd === -1) {
                return;
            }

            const headerText = buffer.slice(0, headerEnd).toString("latin1");
            const lines = headerText.split("\r\n");
            const requestLine = lines.shift() || "";
            const [method = "", path = ""] = requestLine.split(" ");
            const headers = parseHeaders(lines);

            //if there's both content-length and transfer-encdoing as headers, auto reject 
            if (headers["content-length"] && headers["transfer-encoding"]) {
                client.write(
                    "HTTP/1.1 400 Bad Request\r\n" +
                    "Connection: close\r\n" +
                    "\r\n"
                );
                client.end();
                backend.destroy();
                return;
            }

            const bodyStart = headerEnd + 4;
            let bodyEnd;

            if (
                headers["transfer-encoding"] &&
                headers["transfer-encoding"].toLowerCase().includes("chunked")
            ) {
                bodyEnd = readChunkedEnd(buffer, bodyStart);

                if (bodyEnd === null) {
                    return;
                }
            } else if (headers["content-length"]) {
                const length = parseInt(headers["content-length"], 10) || 0;

                if (buffer.length < bodyStart + length) {
                    return;
                }

                bodyEnd = bodyStart + length;
            } else {
                bodyEnd = bodyStart;
            }

            console.log(`[SAFE-GATEWAY] ${method} ${path}`);

            if (path.split("?")[0].toLowerCase().startsWith("/internal")) {
                client.write(
                    "HTTP/1.1 403 Forbidden\r\n" +
                    "Content-Length: 13\r\n" +
                    "Connection: close\r\n" +
                    "\r\n" +
                    "403 Forbidden"
                );
                client.end();
                backend.destroy();
                return;
            }

            backend.write(buffer.slice(0, bodyEnd));

            buffer = buffer.slice(bodyEnd);
        }
    });

    client.on("error", () => backend.destroy());
    client.on("close", () => backend.end());
});

server.listen(PORT, () => {
    console.log(`Safe gateway listening on port ${PORT}`);
});
