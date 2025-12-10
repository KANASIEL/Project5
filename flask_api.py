from flask import Flask, jsonify, request
from flask_cors import CORS
from urllib.parse import unquote
from datetime import datetime
import threading, time, os, asyncio

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

import scripts.naver_news_crawler as crawler

# 🔹 Redis / JSON
import redis
import json

app = Flask(__name__)
CORS(app)

# =======================
# MongoDB 연결
# =======================
MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in Flask")

client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
db = client["stock"]
collection = db["news_crawling"]

# =======================
# Redis 연결
# =======================
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)
CACHE_TTL = 60  # 초 단위, 1분 캐시


# =======================
# pubDate 파싱
# =======================
def _parse_pub_date(value):
    """
    pubDate를 datetime으로 변환.
    - 이미 datetime이면 그대로 반환
    - 문자열이면 여러 포맷을 시도해서 파싱
    - 실패하면 None
    """
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


# =======================
# Mongo 조회 + 정렬/페이지
# =======================
def _sort_and_page(query, page, size, order):
    news_list = list(collection.find(query, {"_id": 0}))

    parsed_list = []
    for news in news_list:
        parsed = _parse_pub_date(news.get("pubDate"))
        if parsed is None:
            # 날짜가 없거나 파싱 불가하면 응답에서 제외
            continue
        news["pubDate"] = parsed
        parsed_list.append(news)

    news_list = parsed_list

    reverse = order != "asc"
    news_list.sort(key=lambda x: x["pubDate"], reverse=reverse)

    start = page * size
    end = start + size
    content = news_list[start:end]

    for news in content:
        news["pubDate"] = news["pubDate"].strftime("%Y-%m-%d %H:%M:%S")

    total_pages = (len(news_list) + size - 1) // size
    return content, total_pages


# =======================
# Redis 캐시 유틸
# =======================
def _cache_key(prefix, category, page, size, order):
    # category 외 필터가 늘어나면 여기에 추가
    cat = category or ""
    return f"{prefix}:cat={cat}:page={page}:size={size}:order={order}"


def get_news_with_cache(prefix, category, page, size, order, query):
    key = _cache_key(prefix, category, page, size, order)

    cached = redis_client.get(key)
    if cached:
        # print("[CACHE HIT]", key)
        return json.loads(cached)

    # print("[CACHE MISS]", key)
    content, total_pages = _sort_and_page(query, page, size, order)
    result = {"content": content, "number": page, "totalPages": total_pages}

    redis_client.setex(key, CACHE_TTL, json.dumps(result))
    return result


# =======================
# 라우트
# =======================
@app.route("/")
def index():
    return "Flask API is running"


@app.route("/news")
def get_news():
    category = unquote(request.args.get("category", ""))
    page = int(request.args.get("page", 0))
    size = int(request.args.get("size", 5))
    order = request.args.get("order", "desc")

    query = {"category": category} if category else {}

    # 🔹 Redis 캐시 사용
    result = get_news_with_cache("news", category, page, size, order, query)
    return jsonify(result)


@app.route("/news/search")
def search_news():
    q = request.args.get("q", "").strip()
    category = unquote(request.args.get("category", ""))
    page = int(request.args.get("page", 0))
    size = int(request.args.get("size", 5))
    order = request.args.get("order", "desc")

    if not q:
        return jsonify({"content": [], "number": 0, "totalPages": 0})

    regex = {"$regex": q, "$options": "i"}

    or_query = {
        "$or": [
            {"title": regex},
            {"content": regex},
            {"author": regex},
            {"media": regex},
        ]
    }

    if category:
        query = {"$and": [{"category": category}, or_query]}
    else:
        query = or_query

    # 검색은 캐시 없이 바로 Mongo에서 조회 (원하면 별도 캐시 가능)
    content, total_pages = _sort_and_page(query, page, size, order)
    return jsonify({"content": content, "number": page, "totalPages": total_pages})


# =======================
# 크롤러 스레드
# =======================
def run_crawler():
    while True:
        asyncio.run(crawler.main())
        time.sleep(3600)


if __name__ == "__main__":
    threading.Thread(target=run_crawler, daemon=True).start()
    port = int(os.environ.get("PORT", 8585))
    app.run(host="0.0.0.0", port=port, debug=False)
