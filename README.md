강사님은 여기 오시면 따봉 하나 누르고 가주세요~

★ Team 4 FOREVER ★

본 Repository를 활용하시는 팀원 분들께,
@@ -14,3 +16,19 @@ MySQL의 경우 마찬가지로 별도의 Server 접속 및 조작이 필요 없
각자의 PC에서 SQL Server 접속을 통한 작업을 하도록 구성중에 있습니다.

본 서버는 공인 Web 인증서 발급 기관을 통한 Certification 인증서 기반의 HTTPS(443) 웹 서버 입니다.

1. Github Repository Commit 시 -> Webhook (5000/TCP)로 Signal 200 POST

2. EC2 (Www.team4isbest.chungyun.net)의 FrontEnd 및 BackEnd Container가 5000 POST를 수신, 
   지정된 Shell Script를 실행하여 자동으로 git pull을 수행하고 서버를 Reload 합니다.

3. BackEnd의 Webhook External이 200 POST를 수신하면 Host Network를 통해서 
   BackEnd와 FrontEnd가 통신 (5001/TCP) 및 FrontEnd도 마찬가지로 같은 동작을 수행합니다.

EC2
|- Docker-Compose
|   |- Docker Container (docker.io:latest, docker-compose:latest)
|- Docker Images
|   |- frontend:latest & backend:latest from macer02/docker hub repository
|- Containers
|   |- team4-frontend & team4-backend & team4-mysql
