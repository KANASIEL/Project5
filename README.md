프로젝트 실행 및 환경 설정 가이드
1. MongoDB 설정

Connection Name: Project5

Database Name: stock

Collection Name: test

⚠️ 위 DB 설정은 테스트용 임시 설정입니다. 프로젝트 진행 상황에 따라 변경될 수 있습니다.

2. Python 환경 설정

필요한 패키지 설치:

pip install requests beautifulsoup4 lxml pandas pymongo

테스트 스크립트:

프로젝트 내 script 폴더의 test.py 파일을 참고하세요.

3. Python 실행 및 MongoDB 확인

Python을 실행합니다.

MongoDB에서 데이터가 정상적으로 저장되는지 확인합니다.


4. React 실행 시 참고 사항

Node.js 설치 필수

프로젝트 루트 디렉토리에서 터미널 실행 후:

cd frontend
npm install
npm run dev

데이터 확인--
백엔드에서 데이터가 정상적으로 넘어오는지 확인:
http://localhost:8585/api/stocks

프론트에서 데이터 렌더링 확인:
http://localhost:5173/stocks
