import asyncio
import aiohttp
from bs4 import BeautifulSoup
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import datetime
import os

# 1. MongoDB 연결 (기존과 동일)
MONGO_URI = os.environ.get("MONGO_URI") 
# 로컬 테스트용 (필요시 주석 해제)
# MONGO_URI = "mongodb+srv://..." 

client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
db = client["stock"]
collection = db["news_global"]

# 로고 정보
MEDIA_LOGOS = {
    "Reuters": "https://www.reuters.com/pf/resources/images/reuters-logo.png",
    "CNBC": "https://upload.wikimedia.org/wikipedia/commons/e/e3/CNBC_logo.svg",
    "CNN": "https://upload.wikimedia.org/wikipedia/commons/b/b1/CNN.svg",
    "BBC": "https://upload.wikimedia.org/wikipedia/commons/b/bc/BBC_News_2022.svg",
    "Yahoo Finance": "https://s.yimg.com/cv/apiv2/default/logo_yahoo_finance.png"
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

async def fetch_rss(session, url):
    async with session.get(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/rss+xml, application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
        timeout=20,
        allow_redirects=True,
    ) as res:
        text = await res.text()
        return BeautifulSoup(text, "xml")

# ------------------------------------------------
# 공통: 상세 페이지 파싱 (비동기)
# ------------------------------------------------
async def get_article_detail(session, url, source):
    try:
        async with session.get(url, headers=HEADERS, timeout=10) as res:
            text = await res.text()
            soup = BeautifulSoup(text, "html.parser")

            # 본문
            paragraphs = soup.select("p")
            content = "\n".join([p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 20])

            # 이미지
            image_url = ""
            meta_img = soup.select_one("meta[property='og:image']")
            if meta_img:
                temp = meta_img["content"]
                if ".svg" not in temp and "logo" not in temp.lower():
                    image_url = temp

            # 작성자 (기존 로직 재사용)
            author = extract_author(soup, source)
            
            return content, image_url, author
    except Exception as e:
        print(f"[DETAIL ERROR] {url} → {e}")
        return "", "", None

def extract_author(soup, source):
    # (기존과 동일한 로직, 너무 길어서 생략하지 않고 핵심만 유지)
    author = None
    try:
        if source == "Reuters":
            tag = soup.select_one("span[data-testid='author-name']")
            author = tag.get_text(strip=True) if tag else None
        elif source == "CNBC":
            tag = soup.select_one(".ArticleHeader-author a")
            author = tag.get_text(strip=True) if tag else None
        elif source == "CNN":
            tag = soup.select_one(".byline__names")
            author = tag.get_text(strip=True) if tag else None
        elif source == "BBC":
            tag = soup.select_one(".ssrcss-1rv0p4l-Contributor")
            author = tag.get_text(strip=True) if tag else None
        elif source == "Yahoo Finance":
            tag = soup.select_one("[data-testid='author-name']")
            author = tag.get_text(strip=True) if tag else None
    except:
        pass
    return author

# ------------------------------------------------
# 공통: DB 저장 (동기)
# ------------------------------------------------
def save_news(title, link, content, image_url, source, author):
    if collection.find_one({"link": link}):
        print(f"   [SKIP] {source}: {title[:15]}...")
        return

    doc = {
        "title": title,
        "link": link,
        "content": content,
        "image_url": image_url,
        "source": source,
        "mediaLogo": MEDIA_LOGOS.get(source, ""),
        "author": author,
        "region": "global",
        "pubDate": datetime.datetime.now(),
        "createdAt": datetime.datetime.now()
    }
    try:
        collection.insert_one(doc)
        print(f"   ✔ 저장됨: {title[:20]}")
    except Exception as e:
        print(f"   ❌ 저장 실패: {e}")

# ------------------------------------------------
# 각 사이트별 리스트 가져오기 (비동기)
# ------------------------------------------------
async def crawl_reuters(session):
    print("▶ Reuters RSS 시작")

    soup = await fetch_rss(
        session,
        "https://www.reuters.com/rssFeed/worldNews"
    )

    items = soup.find_all("item")[:30]
    print(f"   Reuters RSS items: {len(items)}")

    for item in items:
        title = item.title.text.strip()
        link = item.link.text.strip()

        content, img, auth = await get_article_detail(session, link, "Reuters")
        save_news(title, link, content, img, "Reuters", auth)


async def crawl_cnbc(session):
    print("▶ CNBC RSS 시작")

    rss_url = "https://www.cnbc.com/id/100727362/device/rss/rss.html"

    try:
        async with session.get(rss_url, headers=HEADERS, timeout=15) as res:
            xml = await res.text()
            soup = BeautifulSoup(xml, "xml")

            items = soup.find_all("item")[:30]

            for item in items:
                title = item.title.text.strip()
                link = item.link.text.strip()

                if not title or not link:
                    continue

                content, img, auth = await get_article_detail(session, link, "CNBC")
                save_news(title, link, content, img, "CNBC", auth)

    except Exception as e:
        print(f"⚠ CNBC RSS 에러: {e}")
        
async def crawl_bbc(session):
    print("▶ BBC RSS 시작")

    soup = await fetch_rss(
        session,
        "https://feeds.bbci.co.uk/news/business/rss.xml"
    )

    items = soup.find_all("item")[:30]
    print(f"   BBC RSS items: {len(items)}")

    for item in items:
        title = item.title.text.strip()
        link = item.link.text.strip()

        content, img, auth = await get_article_detail(session, link, "BBC")
        save_news(title, link, content, img, "BBC", auth)



async def crawl_cnn(session):
    print("▶ CNN RSS 시작")

    rss_url = "http://rss.cnn.com/rss/money_latest.rss"

    try:
        async with session.get(rss_url, headers=HEADERS, timeout=15) as res:
            xml = await res.text()
            soup = BeautifulSoup(xml, "xml")

            items = soup.find_all("item")[:30]

            for item in items:
                title = item.title.text.strip()
                link = item.link.text.strip()

                if "video" in link.lower():
                    continue

                content, img, auth = await get_article_detail(session, link, "CNN")
                save_news(title, link, content, img, "CNN", auth)

    except Exception as e:
        print(f"⚠ CNN RSS 에러: {e}")


async def crawl_yahoo(session):
    print("▶ Yahoo RSS 시작")

    soup = await fetch_rss(
        session,
        "https://finance.yahoo.com/rss/topstories"
    )

    items = soup.find_all("item")[:30]
    print(f"   Yahoo RSS items: {len(items)}")

    for item in items:
        title = item.title.text.strip()
        link = item.link.text.strip()

        content, img, auth = await get_article_detail(
            session, link, "Yahoo Finance"
        )
        save_news(title, link, content, img, "Yahoo Finance", auth)

# ------------------------------------------------
# ★ 메인 실행 함수 (Async)
# ------------------------------------------------
async def task_global_crawling():
    print(f"\n[{datetime.datetime.now()}] 🌍 글로벌 뉴스 크롤링 시작 (Async)")
    async with aiohttp.ClientSession() as session:
        # 5개 사이트를 '동시에' 실행 (병렬 처리)
        await asyncio.gather(
            crawl_reuters(session),
            crawl_cnbc(session),
            crawl_bbc(session),
            crawl_cnn(session),
            crawl_yahoo(session)
        )
    print("🎉 글로벌 크롤링 완료!")
