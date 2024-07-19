This repository facilitates development with MySQL server operations conducted individually on PCs without the need for separate server connections.

The server operates as an HTTPS (443) web server based on Certification from a public web authentication certificate issuing authority.

Upon GitHub repository commits, a webhook (5000/TCP) signals a successful POST with a status 200.

EC2 (Www.team4isbest.chungyun.net) receives 5000 POSTs to its FrontEnd and BackEnd containers, executes designated shell scripts, automatically performs a git pull, and reloads the server.

When the BackEnd's webhook receives a 200 POST externally, communication between the BackEnd and FrontEnd occurs via the Host Network (5001/TCP). The FrontEnd behaves similarly.

EC2 |- Docker-Compose | |- Docker Container (docker.io
, docker-compose
) |- Docker Images | |- frontend
& backend
from macer02/docker hub repository |- Containers | |- team4-frontend & team4-backend & team4-mysql
