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
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://edition.cnn.com/",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "max-age=0",
    "Connection": "keep-alive"
}

DEFAULT_IMAGE = "https://via.placeholder.com/400x220?text=No+Image"
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
# 맨 위에 있는 get_article_detail만 남기고 수정
async def get_article_detail(session, url, source):
    try:
        # 타임아웃을 조금 더 넉넉하게 10초로 설정
        async with session.get(url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=10)) as res:
            if res.status != 200:
                print(f"[DETAIL FAIL] {source} {res.status} {url}")
                return "", "", None
            
            html = await res.text()
            soup = BeautifulSoup(html, "html.parser")

            # --- [본문 추출 로직 개선] ---
            # 불필요한 태그 제거
            for tag in soup(["script", "style", "nav", "footer", "header", "form", "button"]):
                tag.decompose()

            content = ""
            paragraphs = []

            # 사이트별 본문 태그가 다를 수 있어서 공통적으로 P태그를 찾되, 특정 영역 우선 검색
            if source == "CNN":
                # CNN은 article__content 클래스 내부가 진짜 본문
                main_div = soup.select_one(".article__content") or soup.select_one(".zn-body-text")
                if main_div:
                    paragraphs = main_div.select("p")
                else:
                    paragraphs = soup.select("p")
            
            elif source == "Reuters":
                # Reuters는 article-body__content 클래스 내부가 본문
                main_div = soup.select_one("div[class*='article-body__content']") or soup.select_one("article")
                if main_div:
                    paragraphs = main_div.select("p")
                else:
                    paragraphs = soup.select("p")
            
            else:
                paragraphs = soup.select("p")

            # 본문 정제
            content = "\n".join(
                p.get_text(strip=True)
                for p in paragraphs
                if len(p.get_text(strip=True)) > 30  # 너무 짧은 문장(광고 등) 제외
            )

            # --- [이미지 추출 로직 개선] ---
            image_url = ""
            og_img = soup.select_one("meta[property='og:image']")
            if og_img:
                temp_img = og_img.get("content", "")
                # 로고나 아이콘 같은 작은 이미지가 걸리는 것 방지
                if temp_img and "http" in temp_img and "logo" not in temp_img.lower() and ".svg" not in temp_img:
                    image_url = temp_img

            # --- [작성자 추출] ---
            author = extract_author(soup, source)
            
            return content, image_url, author

    except Exception as e:
        print(f"[DETAIL ERROR] {source} : {e}")
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

    if not image_url:
        image_url = MEDIA_LOGOS.get(source) or DEFAULT_IMAGE

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
    # 주소 변경: worldNews -> businessNews (더 안정적)
    rss_url = "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best"
    # 혹은: "https://www.reuters.com/rssFeed/businessNews" (이게 막히면 위 주소 사용)
    
    try:
        # Reuters는 RSS 요청도 헤더가 없으면 403 Forbidden 뜰 수 있음
        soup = await fetch_rss(session, "https://www.reuters.com/rssFeed/businessNews")
        items = soup.find_all("item")[:15] # 개수 조절

        for i, item in enumerate(items):
            title = item.title.text.strip()
            link = item.link.text.strip()
            
            # Reuters 링크가 가끔 redirect 페이지일 수 있음
            if "reuters.com" not in link:
                continue

            print(f"   [Reuters {i+1}] {title[:30]}")
            content, img, auth = await get_article_detail(session, link, "Reuters")
            
            # 본문 없으면 저장 안 함
            if len(content) < 50:
                print(f"   [SKIP] Reuters 본문 부족")
                continue

            save_news(title, link, content, img, "Reuters", auth)
            
    except Exception as e:
        print(f"⚠ Reuters 크롤링 실패: {e}")

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
    # 최신 비즈니스 RSS
    rss_url = "http://rss.cnn.com/rss/edition_business.rss"
    
    try:
        soup = await fetch_rss(session, rss_url)
        items = soup.find_all("item")[:15]

        for i, item in enumerate(items):
            title = clean_title(item.title.text.strip())
            link = item.link.text.strip()
            
            # 동영상/라이브 뉴스 제외
            if "/videos/" in link or "/live-news/" in link:
                continue

            # 1. 본문 크롤링 시도
            content, img, auth = await get_article_detail(session, link, "CNN")

            # 2. [비상 대책] 크롤링 실패 시 RSS 설명글(description) 사용
            if len(content) < 50:
                print(f"   ⚠ [CNN] 본문 크롤링 실패 -> RSS 요약글 사용 시도")
                if item.description:
                    desc_soup = BeautifulSoup(item.description.text, "html.parser")
                    content = desc_soup.get_text(strip=True)

            # 3. 그래도 내용이 없으면 저장 안 함
            if len(content) < 20: 
                print(f"   [SKIP] CNN 내용 없음 ({title[:15]}...)")
                continue

            print(f"   ✔ [CNN {i+1}] 저장 시도: {title[:20]}")
            save_news(title, link, content, img, "CNN", auth)

    except Exception as e:
        print(f"⚠ CNN 크롤링 에러: {e}")
        
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
