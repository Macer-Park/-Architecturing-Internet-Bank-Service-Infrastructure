★ Team 4 FOREVER ★

본 Repository를 활용하시는 팀원 분들께,

본 Repository는 현재 www.team4isbest.chungyun.net Web을 구축하기 위한 용도로 사용되고 있습니다.

Webhook 기능을 사용하여 본 Repository에 작업물을 Push할 경우, 
본 서버에서 이를 자동으로 인식, POST하여 Server를 Reload 합니다.

따라서 본 Repository를 각자의 VSCode 또는 Workstation에 연동하고, 
작업물을 실시간으로 업로드 또는 수정 및 롤백하여 웹의 변경사항을 확인할 수 있습니다.

MySQL의 경우 마찬가지로 별도의 Server 접속 및 조작이 필요 없도록, 
각자의 PC에서 SQL Server 접속을 통한 작업을 하도록 구성중에 있습니다.

본 서버는 공인 Web 인증서 발급 기관을 통한 Certification 인증서 기반의 HTTPS(443) 웹 서버 입니다.

server.js 파일에 해당 인증서를 참조한 서버 개설 구문이 포함되어 있으며 이외에도 DB 연동을 위한 구문이 작성 되어있습니다.

따라서 server.js에 새로운 구문을 추가 할 경우, 
기존의 Snapshot으로 저장한 "최초" 상태의 Server.js에 대한 내용을 변경하시지 않도록 유의 하시기 바랍니다.

예) "server.js에 Route 구문을 추가하기 위해 기존의 내용을 유지하고 맨 밑에 내용 추가."

