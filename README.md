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



## 📰 내가 담당한 역할

- 해외 뉴스 크롤링 로직 구현
- 비동기 기반 뉴스 수집 처리 (asyncio, aiohttp)
- 기사 제목, 본문, 언론사, 작성일, 이미지 URL 등 핵심 데이터 추출
- 불완전하거나 품질이 낮은 기사 데이터 필터링 로직 구현
- 크롤링된 뉴스 데이터를 MongoDB에 구조화하여 저장
- 뉴스 페이지와 데이터 연동 및 카테고리별 뉴스 조회 지원



## 🧠 구현 포인트

- 비동기 크롤링을 적용하여 대량 뉴스 수집 시 I/O 대기 시간 최소화
- 기사 품질 유지를 위해 제목·본문·작성일·언론사 기준의 데이터 필터링 적용
- 중복 기사 저장을 방지하기 위해 기사 URL 기준 중복 체크 로직 적용




## 🧩 주요 코드

async def task_global_crawling():
    global is_global_crawling
    if is_global_crawling:
        return
        
    is_global_crawling = True
    try:
        async with aiohttp.ClientSession() as session:
            await asyncio.gather(
                crawl_generic(session, "https://www.cnbc.com/id/100727362/device/rss/rss.html", "CNBC"),
                crawl_generic(session, "https://feeds.bbci.co.uk/news/business/rss.xml", "BBC"),
                crawl_yahoo(session),
                return_exceptions=True
            )

        # 크롤링 끝나면 Redis 캐시 생성
        cache_global_news()

    finally:
        is_global_crawling = False

- 해외 뉴스 크롤링 전체 흐름을 제어하는 메인 비동기 태스크
- 여러 해외 뉴스 소스를 asyncio.gather로 병렬 수집
- 크롤링 완료 후 Redis 캐시 생성까지 자동 처리



async def get_article_detail(session, url, source):
    try:
        async with session.get(url, headers=HEADERS, timeout=10) as res:
            if res.status != 200:
                return "", "", None
                
            soup = BeautifulSoup(await res.text(), "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
                
            paragraphs = soup.select("p")
            content = "\n".join(
                p.get_text(strip=True)
                for p in paragraphs
                if len(p.get_text(strip=True)) > 30
            )
            
            og = soup.select_one("meta[property='og:image']")
            image_url = og.get("content") if og else ""
            author = extract_author(soup, source)
            return content, image_url, author
            
    except:
        return "", "", None
        
- 해외 뉴스 상세 페이지에서 본문, 이미지, 작성자 정보 추출
- 불필요한 태그 제거를 통한 콘텐츠 정제 처리
- 소스별 작성자 추출 로직 분기 처리



def cache_global_news():
    news = list(
        collection.find({"region": "global"})
        .sort("pubDate", -1)
        .limit(200)
    )
    for n in news:
        n["_id"] = str(n["_id"])
    redis_client.setex(
        REDIS_KEY_GLOBAL_LATEST,
        CACHE_TTL,
        json.dumps(news)
    )
    print("Redis 글로벌 뉴스 캐시 갱신 완료")

- 최신 해외 뉴스 데이터를 Redis에 캐시 저장
- 화면/API 요청 시 DB 조회 없이 빠른 응답 제공
- 캐시 TTL을 적용하여 데이터 최신성 유지




## 🌐 해외 뉴스 API 서버 (Flask)

해외 뉴스 크롤링 데이터를 제공하기 위한 Flask 기반 API 서버로,  
Redis 캐시를 활용하여 빠른 뉴스 조회 및 검색 기능을 제공합니다.



## 🧩 주요 엔드포인트

### GET /news/global
- 해외 뉴스 목록 조회 API
- 언론사(CNN, BBC, CNBC) 필터링 지원
- 페이지네이션 및 정렬(desc/asc) 지원
- Redis 캐시 적용


### GET /news/global/search
- 해외 뉴스 검색 API
- 제목, 본문, 작성자, 언론사 기준 검색
- 검색 결과 Redis 캐싱 적용



## ⚙ 핵심 로직
# 해외 뉴스 크롤링 스케줄 실행
def run_global_crawler():
    while True:
        try:
            asyncio.run(task_global_crawling())
        except Exception as e:
            print(f"[GLOBAL CRAWLER ERROR] {e}")

        time.sleep(900)  # 15분
        

# Redis 캐시 기반 조회 로직
def get_global_with_cache(prefix, source, page, size, order, query):
    key = _cache_key_global(prefix, source, page, size, order)

    cached = redis_client.get(key)
    if cached:
        return json.loads(cached)

    content, total_pages = _sort_and_page_global(query, page, size, order)
    result = {"content": content, "number": page, "totalPages": total_pages}

    redis_client.setex(key, CACHE_TTL, json.dumps(result))
    return result


# 뉴스 데이터 품질 검증
def _is_valid_news(news: dict) -> bool:
    title = (news.get("title") or "").strip()
    content = (news.get("content") or "").strip()
    source = (news.get("source") or "").strip()

    if len(title) < 5:
        return False
    if len(content) < 30:
        return False
    if not source:
        return False

    return True






## ⚡ 성능 최적화 및 설계 포인트
- Redis 캐시 적용으로 해외 뉴스 목록 및 검색 API 응답 속도 개선
- 캐시 TTL 설정을 통해 데이터 최신성과 성능의 균형 유지
- 페이지네이션 시 불완전 데이터 필터링을 고려한 여유 조회(limit * 2) 전략 적용
- Flask 서버와 크롤링 태스크를 분리하여 안정적인 서비스 제공
