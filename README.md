# StockNews 🚀

[![개발 기간](https://img.shields.io/badge/개발%20기간-2025.12.02%20~%202025.12.16-blue?style=flat-square)]
[![팀원 수](https://img.shields.io/badge/팀원-6명-green?style=flat-square)]

<img src="https://github.com/user-attachments/assets/1231967b-c1d3-4f0e-8ad4-81def337bf63" alt="프로젝트 메인 대시보드 스크린샷" />

## 프로젝트 소개

**실시간 국내 주식 시세 모니터링 웹 대시보드** 📈

이 프로젝트는 웹 크롤링 기술을 활용한 로봇이 KOSPI/KOSDAQ 종목의 실시간 시세와 국내·해외 관련 뉴스를 자동 수집하고,  
수집된 데이터들을 가공하여 사용자에게 한눈에 보여줍니다.

### 개발 기간
2025.12.02 ~ 2025.12.16

### 팀원 및 역할

| 이름   | 역할                          | GitHub                                                                 |
|--------|-------------------------------|------------------------------------------------------------------------|
| 정태규 | [팀장] 국내주식 크롤링, 실시간 대시보드 등            | [![GitHub](https://img.shields.io/badge/GitHub-000000?style=flat&logo=github&logoColor=white)](https://github.com/KANASIEL) |
| 조슬미 | 국내/해외 뉴스 크롤링, 뉴스페이지 등                  | [![GitHub](https://img.shields.io/badge/GitHub-000000?style=flat&logo=github&logoColor=white)](https://github.com/jseulmi) |
| 서원희 | 국내/해외 뉴스 크롤링, 뉴스페이지 등                  | [![GitHub](https://img.shields.io/badge/GitHub-000000?style=flat&logo=github&logoColor=white)](https://github.com/wonhui29) |
| 구현서 | 로그인/회원가입, 다국어UI 등                         | [![GitHub](https://img.shields.io/badge/GitHub-000000?style=flat&logo=github&logoColor=white)](https://github.com/guhyeonseo) |
| 손원주 | 검색엔진 (형태소 분석 TF-IDF랭킹 오타보정), AI요약 등 | [![GitHub](https://img.shields.io/badge/GitHub-000000?style=flat&logo=github&logoColor=white)](https://github.com/swj6498) |
| 지윤정 | 검색엔진 (형태소 분석 TF-IDF랭킹 오타보정), AI요약 등 | [![GitHub](https://img.shields.io/badge/GitHub-000000?style=flat&logo=github&logoColor=white)](https://github.com/Jiyunzeng) |

## 기술 스택 🛠️

| 카테고리             | 기술                                                                                                                                 |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| 운영체제             | ![Ubuntu](https://img.shields.io/badge/Ubuntu-E95420?style=flat&logo=ubuntu&logoColor=white)&nbsp;![Windows 11](https://img.shields.io/badge/Windows%2011-0078D6?style=flat&logo=windows11&logoColor=white) |
| 언어                 | ![Java](https://img.shields.io/badge/Java-ED8B00?style=flat&logo=openjdk&logoColor=white)&nbsp;![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)&nbsp;![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) |
| 백엔드 프레임워크    | ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F?style=flat&logo=springboot&logoColor=white)&nbsp;![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)&nbsp;![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white) |
| 프론트엔드           | ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=white)&nbsp;![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)&nbsp;![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white)&nbsp;![Fetch API](https://img.shields.io/badge/Fetch%20API-FF4154?style=flat&logo=javascript&logoColor=white) |
| ORM / 데이터 접근     | ![MyBatis](https://img.shields.io/badge/MyBatis-000000?style=flat&logo=mybatis&logoColor=white)                                       |
| 데이터베이스          | ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)&nbsp;![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-47A248?style=flat&logo=mongodb&logoColor=white)&nbsp;![Oracle](https://img.shields.io/badge/Oracle-F80000?style=flat&logo=oracle&logoColor=white) |
| 인증 / 보안          | ![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)&nbsp;![OAuth2](https://img.shields.io/badge/OAuth2-EB5424?style=flat&logo=open%20id&logoColor=white)&nbsp; |
| AI / 외부 API        | ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)&nbsp;![Perplexity.ai](https://img.shields.io/badge/Perplexity.ai-000000?style=flat&logo=perplexity-ai&logoColor=white) ![Naver](https://img.shields.io/badge/Naver-03C75A?style=flat&logo=naver&logoColor=white)&nbsp;![Google](https://img.shields.io/badge/Google-EA4335?style=flat&logo=google&logoColor=white)&nbsp;![Kakao](https://img.shields.io/badge/Kakao-FFCD00?style=flat&logo=kakao&logoColor=black) |
| 배포 / 호스팅        | ![Render](https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=black)                                          |
| 개발 도구 / IDE      | ![IntelliJ IDEA](https://img.shields.io/badge/IntelliJ%20IDEA-000000?style=flat&logo=intellijidea&logoColor=white)&nbsp;![STS](https://img.shields.io/badge/Spring%20Tool%20Suite-6DB33F?style=flat&logo=spring&logoColor=white)&nbsp;![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?style=flat&logo=visualstudiocode&logoColor=white) |
| 형상 관리 / 협업     | ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)&nbsp;![Notion](https://img.shields.io/badge/Notion-000000?style=flat&logo=notion&logoColor=white) |

## 🕷️ 주요 크롤링 코드

<details>
<summary><strong>📈 실시간 국내주식 크롤링 (KOSPI · KOSDAQ)</strong></summary>

본 스크립트는 네이버 금융의 KOSPI·KOSDAQ 시가총액 페이지를 대상으로  
국내 주식 종목 데이터를 매일 자동 수집하는 배치 크롤러입니다.

- 대상 시장: KOSPI / KOSDAQ  
- 저장 방식: MongoDB Upsert  
- 캐시 처리: Redis 캐시 무효화  
- 시간 기준: KST (Asia/Seoul)

---

<details>
<summary><strong>MongoDB · Redis 초기화 및 인덱스</strong></summary>

크롤러 실행 시 MongoDB와 Redis에 연결하며,  
시장별 컬렉션을 분리하고 종목 코드(`code`) 기준으로 unique index를 생성합니다.

```python
mongo_client = pymongo.MongoClient("mongodb+srv://...")
db = mongo_client["stock"]
kospi_col = db["naver_kospi"]
kosdaq_col = db["naver_kosdaq"]

col.create_index("code", unique=True)
```

</details> <details> <summary><strong>HTTP 요청 안정화 (Session + Retry)</strong></summary>
네이버 금융 서버의 일시적 오류나 요청 제한에 대응하기 위해
Session과 Retry 전략을 적용했습니다.

```python
session = requests.Session()
session.mount("https://", HTTPAdapter(max_retries=retries))
```
User-Agent 랜덤 적용
서버 오류 및 요청 제한 대응

</details> <details> <summary><strong>데이터 정제 유틸 함수</strong></summary>
크롤링된 문자열 데이터를 숫자 타입으로 변환하기 위해
정제 함수를 별도로 구현했습니다.

```python
def clean_int(text):
    if not text or text.strip() in ["N/A", "-", ""]:
        return None
    return int(text.replace(",", ""))
```

</details> <details> <summary><strong>단일 페이지 크롤링 로직</strong></summary>
KOSPI(sosok=0)와 KOSDAQ(sosok=1) 페이지를 구분하여 요청하며,
시가총액 테이블에서 핵심 종목 정보를 추출합니다.

```python
def crawl_page(sosok, page):
    url = f"https://finance.naver.com/sise/sise_market_sum.naver?sosok={sosok}&page={page}"
```
종목명 / 종목코드

현재가, 등락률

시가총액, 거래량, PER, ROE

</details> <details> <summary><strong>페이지 순회 및 종료 조건</strong></summary>
불필요한 요청을 줄이기 위해
빈 페이지가 연속으로 발생하면 자동으로 크롤링을 종료합니다.

```python
for page in range(1, 60):
    if empty_streak >= 3:
        break
```

</details> <details> <summary><strong>Bulk Upsert 저장 방식</strong></summary>
수집된 데이터는 종목 코드 기준으로
삽입 또는 수정이 동시에 가능한 Upsert 구조로 저장됩니다.

```python
UpdateOne(
    {"code": x["code"]},
    {"$set": x},
    upsert=True
)
```

</details> <details> <summary><strong>Redis 캐시 무효화</strong></summary>
모든 데이터 저장이 완료된 이후,
서비스에서 사용 중인 종목 리스트 캐시를 삭제하여
다음 조회 시 최신 데이터가 로드되도록 처리합니다.

```python
r.delete("krx_kospi_list", "krx_kosdaq_list")
```

</details> <details> <summary><strong>실행 및 성능 로그</strong></summary>
크롤링 시작과 종료 시간을 기록하여
배치 작업 성능을 모니터링할 수 있도록 구성했습니다.

```python
start_time = time.time()
print(f"소요 시간: {time.time() - start_time:.1f}초")
```
</details> </details>

<details>
<summary><strong>🇰🇷 국내 뉴스 크롤링 (네이버 뉴스)</strong></summary>

본 스크립트는 네이버 뉴스의 경제 섹션을 대상으로  
국내 주요 뉴스를 **비동기 방식**으로 수집하는 크롤러입니다.  
카테고리별 뉴스 목록을 조회한 뒤, 각 기사 상세 페이지를 병렬로 크롤링하여  
MongoDB에 저장합니다.

- 대상: 네이버 국내 뉴스 (경제 섹션)
- 방식: asyncio + aiohttp 비동기 크롤링
- 저장소: MongoDB
- 실행 방식: FastAPI / 배치 작업에서 함수 단위 호출

---

<details>
<summary><strong>MongoDB 연결 및 환경 변수 설정</strong></summary>

MongoDB 접속 정보는 보안을 위해 **환경 변수(MONGO_URI)** 로 관리합니다.  
환경 변수가 설정되지 않은 경우 크롤러 실행을 중단하도록 구성했습니다.

```python
MONGO_URI = os.environ.get("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in crawler")

client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
db = client["stock"]
collection = db["news_crawling"]
```
운영 환경 보안 강화
로컬 / 배포 환경 분리 가능

</details> <details> <summary><strong>뉴스 카테고리 정의</strong></summary>
네이버 경제 뉴스의 세부 카테고리를 딕셔너리로 정의하여
카테고리별 크롤링이 가능하도록 구성했습니다.

```python
CATEGORY_URLS = {
    "금융": "https://news.naver.com/breakingnews/section/101/259",
    "증권": "https://news.naver.com/breakingnews/section/101/258",
    "산업/재계": "https://news.naver.com/breakingnews/section/101/261",
    "중기/벤처": "https://news.naver.com/breakingnews/section/101/771",
    "글로벌 경제": "https://news.naver.com/breakingnews/section/101/260",
    "생활경제": "https://news.naver.com/breakingnews/section/101/310",
    "경제 일반": "https://news.naver.com/breakingnews/section/101/263",
}
```
카테고리 확장 용이

카테고리별 로그 및 통계 관리 가능

</details> <details> <summary><strong>모바일 → PC 뉴스 URL 변환</strong></summary>
모바일 뉴스 링크를 PC 뉴스 링크로 변환하여
일관된 HTML 구조에서 파싱할 수 있도록 처리했습니다.

```python
def to_pc_url(link):
    if "m.news.naver.com" in link:
        return link.replace("m.news.naver.com", "n.news.naver.com")
    return link
```
</details> <details> <summary><strong>뉴스 상세 페이지 비동기 크롤링</strong></summary>
기사 상세 페이지에서 작성자, 본문, 언론사, 대표 이미지, 작성일,
언론사 로고 등을 추출합니다.

```python
async def fetch_news_detail(session, link):
    async with session.get(link, headers=headers, timeout=15) as resp:
        html = await resp.text()
```
BeautifulSoup 기반 HTML 파싱
광고, 스크립트 제거 후 본문 정제
meta 태그 기반 정보 보완 추출

</details> <details> <summary><strong>뉴스 목록 크롤링</strong></summary>
카테고리 페이지에서 뉴스 제목과 링크 목록을 수집합니다.

```python
async def fetch_news_list(session, url, max_items=1000):
    soup = BeautifulSoup(html, "lxml")
    items = soup.select("a.sa_text_title")
```
최대 수집 개수 제한

상대 경로 → 절대 경로 변환

</details> <details> <summary><strong>카테고리별 크롤링 및 중복 처리</strong></summary>
이미 MongoDB에 저장된 뉴스는 제외하고,
신규 기사만 상세 크롤링 대상으로 처리합니다.

```python
if collection.find_one({"link": news["link"]}):
    continue
```
중복 크롤링 방지
임시 문서 선삽입 후 상세 정보 업데이트

</details> <details> <summary><strong>기사 품질 검증 및 필터링</strong></summary>
제목, 본문, 언론사, 작성일 기준으로
품질이 낮은 기사는 자동 제거합니다.

```python
if not has_title or (not has_content and not (has_media and has_date)):
    collection.delete_one({"link": news["link"]})
```
내용 없는 기사 제거
날짜 없는 기사 제거
데이터 신뢰도 향상

</details> <details> <summary><strong>메인 실행 함수</strong></summary>
FastAPI 또는 스케줄러에서 호출할 수 있도록
함수 단위로 실행 구조를 분리했습니다.

```python
async def task_korea_crawling():
    async with aiohttp.ClientSession() as session:
        for category, url in CATEGORY_URLS.items():
            await crawl_category(session, category, url)
```
비동기 병렬 처리
서비스 연동에 최적화

</details> </details> 

