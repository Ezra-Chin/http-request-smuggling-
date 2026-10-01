const net = require("net");

const PORT = 5050;
const BACKEND_HOST = "localhost";
const BACKEND_PORT = 5100;

const server = net.createServer((client) => {
    const backend = net.connect(BACKEND_PORT, BACKEND_HOST);

    let decided = false;
    let head = Buffer.alloc(0);

    backend.on("data", (data) => client.write(data));
    backend.on("error", () => client.destroy());
    backend.on("close", () => client.end());

    client.on("data", (chunk) => {
        //every byte will be forwarded to backend blindly , causing a smuggling could happen 
        if (decided) {
            backend.write(chunk);
            return;
        }

        head = Buffer.concat([head, chunk]);

        //Gateway only looks at the first line , assuming one connecting is just one request, allowing smuggling  of a nother request 
        const lineEnd = head.indexOf("\r\n");

        if (lineEnd === -1) {
            return;
        }

        const requestLine = head.slice(0, lineEnd).toString("latin1");
        const [method = "", path = ""] = requestLine.split(" ");

        console.log(`${new Date().toISOString()} [GATEWAY] ${method} ${path}`);

        decided = true;

        if (path.toLowerCase().startsWith("/internal")) {
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

        //pass on all content to backend wihtout checking 
        backend.write(head);
    });

    client.on("error", () => backend.destroy());
    client.on("close", () => backend.end());
});

server.listen(PORT, () => {
    console.log(`Gateway listening on port ${PORT}`);
});
