import asyncio
import aiohttp
from bs4 import BeautifulSoup
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import datetime
import os
import requests
import re
# =========================
# MongoDB
# =========================
MONGO_URI = os.environ.get("MONGO_URI")
client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
db = client["stock"]
collection = db["news_global"]

# =========================
# 미디어 로고
# =========================
MEDIA_LOGOS = {
    "Reuters": "https://www.reuters.com/pf/resources/images/reuters-logo.png",
    "CNBC": "https://upload.wikimedia.org/wikipedia/commons/e/e3/CNBC_logo.svg",
    "CNN": "https://upload.wikimedia.org/wikipedia/commons/b/b1/CNN.svg",
    "BBC": "https://upload.wikimedia.org/wikipedia/commons/b/bc/BBC_News_2022.svg",
    "Yahoo Finance": "https://s.yimg.com/cv/apiv2/default/logo_yahoo_finance.png"
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# =========================
# RSS Fetch
# =========================
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

# =========================
# 공통 상세 페이지 (async)
# =========================
async def get_article_detail(session, url, source):
    try:
        async with session.get(
            url,
            headers=HEADERS,
            timeout=aiohttp.ClientTimeout(total=8)
        ) as res:
            if res.status != 200:
                print(f"[DETAIL SKIP] {source} {res.status}")
                return "", "", None

            html = await res.text()
            soup = BeautifulSoup(html, "html.parser")

            paragraphs = soup.select("p")
            content = "\n".join(
                p.get_text(strip=True)
                for p in paragraphs
                if len(p.get_text(strip=True)) > 20
            )

            image_url = ""
            og = soup.select_one("meta[property='og:image']")
            if og:
                image_url = og.get("content", "")

            author = extract_author(soup, source)
            return content, image_url, author

    except asyncio.TimeoutError:
        print(f"[DETAIL TIMEOUT] {source}")
        return "", "", None
    except Exception as e:
        print(f"[DETAIL ERROR] {source} → {e}")
        return "", "", None

# =========================
# 작성자 추출
# =========================
def extract_author(soup, source):
    try:
        if source == "Reuters":
            tag = soup.select_one("span[data-testid='author-name']")
        elif source == "CNBC":
            tag = soup.select_one(".ArticleHeader-author a")
        elif source == "CNN":
            tag = soup.select_one(".byline__names")
        elif source == "BBC":
            tag = soup.select_one(".ssrcss-1rv0p4l-Contributor")
        elif source == "Yahoo Finance":
            tag = soup.select_one("[data-testid='author-name']")
        else:
            tag = None

        return tag.get_text(strip=True) if tag else None
    except:
        return None

# =========================
# DB 저장
# =========================
def save_news(title, link, content, image_url, source, author):
    if collection.find_one({"link": link}):
        print(f"   [SKIP] {source}: {title[:30]}")
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
    collection.insert_one(doc)
    print(f"   ✔ 저장됨 [{source}] {title[:40]}")

def clean_title(title):
    # IMG, HTML 태그 제거
    title = re.sub(r"<[^>]+>", "", title)
    title = title.replace("IMG", "").strip()
    return title

# =========================
# Reuters
# =========================
async def crawl_reuters(session):
    print("▶ Reuters RSS 시작")
    soup = await fetch_rss(session, "https://www.reuters.com/rssFeed/worldNews")
    items = soup.find_all("item")[:30]
    print(f"   Reuters RSS items: {len(items)}")

    for i, item in enumerate(items):
        title = item.title.text.strip()
        link = item.link.text.strip()
        print(f"   [Reuters {i+1}/{len(items)}] {title[:40]}")

        content, img, auth = await get_article_detail(session, link, "Reuters")
        save_news(title, link, content, img, "Reuters", auth)

# =========================
# CNBC
# =========================
async def crawl_cnbc(session):
    print("▶ CNBC RSS 시작")
    soup = await fetch_rss(
        session,
        "https://www.cnbc.com/id/100727362/device/rss/rss.html"
    )
    items = soup.find_all("item")[:30]

    for i, item in enumerate(items):
        title = item.title.text.strip()
        link = item.link.text.strip()
        print(f"   [CNBC {i+1}/{len(items)}] {title[:40]}")

        content, img, auth = await get_article_detail(session, link, "CNBC")
        save_news(title, link, content, img, "CNBC", auth)

# =========================
# BBC
# =========================
async def crawl_bbc(session):
    print("▶ BBC RSS 시작")
    soup = await fetch_rss(
        session,
        "https://feeds.bbci.co.uk/news/business/rss.xml"
    )
    items = soup.find_all("item")[:30]

    for i, item in enumerate(items):
        title = item.title.text.strip()
        link = item.link.text.strip()
        print(f"   [BBC {i+1}/{len(items)}] {title[:40]}")

        content, img, auth = await get_article_detail(session, link, "BBC")
        save_news(title, link, content, img, "BBC", auth)

# =========================
# CNN
# =========================
async def crawl_cnn(session):
    print("▶ CNN RSS 시작")
    soup = await fetch_rss(session, "http://rss.cnn.com/rss/money_latest.rss")
    items = soup.find_all("item")[:30]

    for item in items:
        raw_title = item.title.text.strip()
        title = clean_title(raw_title)

        link = item.link.text.strip()
        if "video" in link.lower():
            continue

        content, img, auth = await get_article_detail(session, link, "CNN")
        save_news(title, link, content, img, "CNN", auth)

# =========================
# Yahoo (requests + executor)
# =========================
def get_article_detail_yahoo(url):
    res = requests.get(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept-Language": "en-US,en;q=0.9",
        },
        timeout=15
    )
    soup = BeautifulSoup(res.text, "html.parser")

    paragraphs = soup.select("p")
    content = "\n".join(
        p.get_text(strip=True)
        for p in paragraphs
        if len(p.get_text(strip=True)) > 20
    )

    image_url = ""
    og = soup.select_one("meta[property='og:image']")
    if og:
        image_url = og.get("content", "")

    author = extract_author(soup, "Yahoo Finance")
    return content, image_url, author

async def crawl_yahoo(session):
    print("▶ Yahoo RSS 시작")
    soup = await fetch_rss(
        session,
        "https://finance.yahoo.com/rss/topstories"
    )
    items = soup.find_all("item")[:30]

    loop = asyncio.get_running_loop()

    for i, item in enumerate(items):
        title = item.title.text.strip()
        link = item.link.text.strip()
        print(f"   [Yahoo {i+1}/{len(items)}] {title[:40]}")

        content, img, auth = await loop.run_in_executor(
            None,
            get_article_detail_yahoo,
            link
        )

        save_news(title, link, content, img, "Yahoo Finance", auth)

async def get_article_detail(session, url, source):
    try:
        async with session.get(
            url,
            headers=HEADERS,
            timeout=aiohttp.ClientTimeout(total=8)
        ) as res:
            print(f"[DETAIL] {source} {res.status} {url}")  # ★추가

            if res.status != 200:
                print(f"[DETAIL SKIP] {source} {res.status}")
                return "", "", None

# =========================
# 메인 태스크
# =========================
is_global_crawling = False

async def task_global_crawling():
    global is_global_crawling
    if is_global_crawling:
        print("⏭ 이미 글로벌 크롤링 중")
        return

    is_global_crawling = True
    try:
        print(f"\n[{datetime.datetime.now()}] 🌍 글로벌 뉴스 크롤링 시작")

        timeout = aiohttp.ClientTimeout(total=10)
        connector = aiohttp.TCPConnector(limit=10, ssl=False)

        async with aiohttp.ClientSession(
            timeout=timeout,
            connector=connector
        ) as session:
            await asyncio.gather(
                crawl_reuters(session),
                crawl_cnbc(session),
                crawl_bbc(session),
                crawl_cnn(session),
                crawl_yahoo(session),
                return_exceptions=True
            )

        print("🎉 글로벌 크롤링 완료")

    finally:
        is_global_crawling = False
