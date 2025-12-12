# global_flask_api.py

from flask import Flask, jsonify, request
from flask_cors import CORS
from urllib.parse import unquote
from datetime import datetime, timedelta
import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import redis, json

import threading
import asyncio
from scripts.global_news_crawler import task_global_crawling

app = Flask(__name__)
CORS(app)

# ==========================
# MongoDB & Redis 설정 (해외)
# ==========================
MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in Flask(global)")

client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
db = client["stock"]
collection = db["news_global"]          # ✅ 해외 컬렉션

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6380/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)
CACHE_TTL = 60

# ==========================
# pubDate 파싱
# ==========================
def _parse_pub_date(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        v = value.strip()
        if not v:
            return None
        try:
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        except Exception:
            pass
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                return datetime.strptime(v, fmt)
            except ValueError:
                continue
    return None

# ==========================
# 오래된 해외 뉴스 삭제
# ==========================
def delete_old_global_news(days: int = 30):
    threshold = datetime.now() - timedelta(days=days)
    try:
        result = collection.delete_many({"pubDate": {"$lt": threshold}})
        print(f"[GLOBAL CLEANUP] {result.deleted_count}개 삭제 (기준일: {threshold})")
    except Exception as e:
        print(f"[GLOBAL CLEANUP ERROR] {e}")

# ==========================
# Mongo 정렬 + 페이지네이션 (해외)
# ==========================
def _sort_and_page_global(query, page, size, order):
    sort_dir = -1 if order != "asc" else 1

    cursor = (
        collection.find(query, {"_id": 0})   # id 안 쓸 거면 그대로
        .sort("pubDate", sort_dir)
        .skip(page * size)
        .limit(size)
    )

    content = []
    for news in cursor:
        parsed = _parse_pub_date(news.get("pubDate"))
        if parsed is None:
            continue
        news["pubDate"] = parsed.strftime("%Y-%m-%d %H:%M:%S")
        content.append(news)   # title, link, content, image_url, source,
                               # mediaLogo, author, region 전부 그대로 나감

    total_count = collection.count_documents(query)
    total_pages = (total_count + size - 1) // size
    return content, total_pages

# ==========================
# Redis 캐시 유틸 (해외)
# ==========================
def _cache_key_global(prefix, source, page, size, order):
    s = source or ""
    return f"{prefix}:src={s}:page={page}:size={size}:order={order}"

def get_global_with_cache(prefix, source, page, size, order, query):
    key = _cache_key_global(prefix, source, page, size, order)
    try:
        cached = redis_client.get(key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    content, total_pages = _sort_and_page_global(query, page, size, order)
    result = {"content": content, "number": page, "totalPages": total_pages}

    try:
        redis_client.setex(key, CACHE_TTL, json.dumps(result))
    except Exception:
        pass

    return result

# ==========================
# 라우트 (해외 목록)
# ==========================
@app.route("/news/global")
def get_global_news():
    # React에서 category=Reuters/CNBC... 로 보냄, "전체"면 필터 없음
    source = unquote(request.args.get("category", ""))
    page = int(request.args.get("page", 0))
    size = int(request.args.get("size", 5))
    order = request.args.get("sort", "desc")

    if source and source != "전체":
        query = {"source": source}
    else:
        query = {}

    result = get_global_with_cache("global", source, page, size, order, query)
    return jsonify(result)

# ==========================
# 라우트 (해외 검색)
# ==========================
@app.route("/news/global/search")
def search_global_news():
    q = request.args.get("q", "").strip()
    source = unquote(request.args.get("category", ""))
    page = int(request.args.get("page", 0))
    size = int(request.args.get("size", 5))
    order = request.args.get("sort", "desc")

    if not q:
        return jsonify({"content": [], "number": 0, "totalPages": 0})

    regex = {"$regex": q, "$options": "i"}
    or_query = {
        "$or": [
            {"title": regex},
            {"content": regex},
            {"author": regex},
            {"source": regex},
        ]
    }

    if source and source != "전체":
        query = {"$and": [{"source": source}, or_query]}
    else:
        query = or_query

    content, total_pages = _sort_and_page_global(query, page, size, order)
    return jsonify({"content": content, "number": page, "totalPages": total_pages})

def run_global_crawler():
    while True:
        asyncio.run(task_global_crawling())
        time.sleep(900)  # 1시간마다

# ==========================
# 서버 실행 (Render 필수)
# ==========================
if __name__ == "__main__":
    threading.Thread(
        target=run_global_crawler,
        daemon=True
    ).start()

    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
