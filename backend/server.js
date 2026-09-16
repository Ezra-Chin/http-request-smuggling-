const net = require("net");

const PORT = 5100;

const products = [
    { name: "Bread", price: 5 },
    { name: "Croissant", price: 7 },
    { name: "Baguette", price: 6 },
    { name: "Muffin", price: 4 },
    { name: "Cake", price: 15 }
];

const accounts = [
    { username: "alice", password: "demo-password-001" },
    { username: "bob", password: "demo-password-002" },
    { username: "charlie", password: "demo-password-003" },
    { username: "diana", password: "demo-password-004" },
    { username: "edward", password: "demo-password-005" },
    { username: "frank", password: "demo-password-006" },
    { username: "grace", password: "demo-password-007" },
    { username: "henry", password: "demo-password-008" },
    { username: "irene", password: "demo-password-009" },
    { username: "jack", password: "demo-password-010" }
];

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

const CORS_HEADERS =
    "Access-Control-Allow-Origin: *\r\n" +
    "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n" +
    "Access-Control-Allow-Headers: Content-Type\r\n";

function respond(socket, method, path) {
    console.log(`[BACKEND] ${method} ${path}`);

    if (method === "OPTIONS") {
        socket.write(
            "HTTP/1.1 204 No Content\r\n" +
            CORS_HEADERS +
            "Content-Length: 0\r\n" +
            "Connection: keep-alive\r\n" +
            "\r\n"
        );
        return;
    }

    const route = path.split("?")[0];

    let status = "200 OK";
    let payload;

    if (route === "/api/dashboard") {
        payload = { products };
    } else if (route === "/internal/admin") {
        payload = { accounts };
    } else {
        status = "404 Not Found";
        payload = { error: "Not Found" };
    }

    const body = JSON.stringify(payload);

    socket.write(
        `HTTP/1.1 ${status}\r\n` +
        "Content-Type: application/json\r\n" +
        CORS_HEADERS +
        `Content-Length: ${Buffer.byteLength(body)}\r\n` +
        "Connection: keep-alive\r\n" +
        "\r\n" +
        body
    );
}

const server = net.createServer((socket) => {
    let buffer = Buffer.alloc(0);

    socket.on("data", (chunk) => {
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

            respond(socket, method, path);

            buffer = buffer.slice(bodyEnd);
        }
    });

    socket.on("error", () => socket.destroy());
});

server.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
});
