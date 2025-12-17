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

## 주요 크롤링 코드 🕷️

<details>
<summary><strong>네이버 증권 KOSPI/KOSDAQ 크롤링 코드</strong></summary>
    
**파일명**: `crawler_krx_naver.py`  
**용도**: 네이버 증권에서 KOSPI/KOSDAQ 전 종목 시세를 매일 자동 크롤링 → MongoDB 저장 + Redis 캐시 갱신  
**자동화**: Linux(Ubuntu) crontab을 활용한 월~금 09시부터 15시30분까지 10분 간격 실행 예약
    
```python
# crawler_krx_naver.py
import requests
from bs4 import BeautifulSoup
import pymongo
import redis
from datetime import datetime
import time
import random
from pymongo import UpdateOne
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from zoneinfo import ZoneInfo

# ================== MongoDB + Redis 연결 ==================
mongo_client = pymongo.MongoClient("mongodb+srv://kh:1234@cluster0.fbav0ho.mongodb.net/")
db = mongo_client["stock"]
kospi_col = db["naver_kospi"]      # KOSPI 컬렉션
kosdaq_col = db["naver_kosdaq"]    # KOSDAQ 컬렉션

# Redis 연결 (캐시 무효화용)
try:
    r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_connected = True
    print("Redis 연결 성공")
except Exception:
    r = None
    redis_connected = False
    print("Redis 미연결 → 캐시 갱신 생략")

# MongoDB code 기준 unique 인덱스 자동 생성
for col, name in [(kospi_col, "naver_kospi"), (kosdaq_col, "naver_kosdaq")]:
    if "code_1" not in col.index_information():
        col.create_index("code", unique=True, name="code_1")
        print(f"[{name}] code 인덱스 생성")
    else:
        print(f"[{name}] code 인덱스 이미 존재")

# ================== Requests Session 설정 ==================
session = requests.Session()
session.headers.update({
    "User-Agent": random.choice([
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/123.0 Safari/537.36"
    ]),
    "Referer": "https://finance.naver.com/",
    "Accept-Language": "ko-KR,ko;q=0.9"
})

# 네트워크 오류 재시도 설정
retries = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504, 429])
session.mount("https://", HTTPAdapter(max_retries=retries))

# ================== 데이터 정제 함수 ==================
def clean_int(text):
    if not text or text.strip() in ["N/A", "-", ""]:
        return None
    return int(text.replace(",", ""))

def clean_float(text):
    if not text or text.strip() in ["N/A", "-", ""]:
        return None
    return float(text.replace(",", ""))

# ================== 단일 페이지 크롤링 ==================
def crawl_page(sosok, page):
    url = f"https://finance.naver.com/sise/sise_market_sum.naver?sosok={sosok}&page={page}"
    try:
        res = session.get(url, timeout=12)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "lxml")
        
        rows = soup.select("table.type_2 tbody tr[onmouseover]")
        data = []
        today = datetime.now(ZoneInfo("Asia/Seoul")).strftime("%Y-%m-%d")
        
        for row in rows:
            cols = row.find_all("td")
            if len(cols) < 12: continue
            a_tag = cols[1].find("a")
            if not a_tag: continue
                
            code = a_tag["href"].split("code=")[-1]
            data.append({
                "rank": clean_int(cols[0].get_text(strip=True)),
                "name": a_tag.get_text(strip=True),
                "code": code,
                "current_price": clean_int(cols[2].get_text(strip=True)),
                "change": cols[3].get_text(strip=True),
                "change_rate": cols[4].get_text(strip=True),
                "face_value": clean_int(cols[5].get_text(strip=True)),
                "market_cap": clean_int(cols[6].get_text(strip=True)),
                "listed_shares": clean_int(cols[7].get_text(strip=True)),
                "foreign_ratio": clean_float(cols[8].get_text(strip=True)),
                "volume": clean_int(cols[9].get_text(strip=True)),
                "per": clean_float(cols[10].get_text(strip=True)),
                "roe": clean_float(cols[11].get_text(strip=True)),
                "crawl_date": today,
                "crawled_at": datetime.now(ZoneInfo("Asia/Seoul")),
                "market": "KOSPI" if sosok == 0 else "KOSDAQ"
            })
        return data
    except Exception as e:
        print(f"[{'KOSPI' if sosok==0 else 'KOSDAQ'} {page}p] 오류: {e}")
        return []

# ================== 메인 크롤링 실행 ==================
def run_crawler():
    total_items = 0
    for market_name, sosok, collection in [
        ("KOSPI", 0, kospi_col),
        ("KOSDAQ", 1, kosdaq_col)
    ]:
        print(f"\n{market_name} 크롤링 시작...")
        all_items = []
        empty_streak = 0
        
        for page in range(1, 60):
            items = crawl_page(sosok, page)
            if not items:
                empty_streak += 1
                if empty_streak >= 3:
                    print(f"{market_name} 빈 페이지 연속 → 종료")
                    break
            else:
                empty_streak = 0
                all_items.extend(items)
            print(f" {page:2d}페이지 → {len(items):3d}개")
            time.sleep(random.uniform(0.3, 0.7))
        
        if all_items:
            ops = [UpdateOne({"code": x["code"]}, {"$set": x}, upsert=True) for x in all_items]
            result = collection.bulk_write(ops, ordered=False)
            print(f"{market_name} 저장 완료 → 삽입 {result.upserted_count}, 수정 {result.modified_count}")
            total_items += len(all_items)
    
    # Redis 캐시 무효화
    if redis_connected and r:
        deleted = r.delete("krx_kospi_list", "krx_kosdaq_list")
        print(f"Redis 캐시 갱신 완료 (삭제된 키: {deleted}개)")
    
    print(f"\n전체 크롤링 완료! 총 {total_items}개 종목 업데이트")

if __name__ == "__main__":
    start_time = time.time()
    run_crawler()
    print(f"\n소요 시간: {time.time() - start_time:.1f}초")
