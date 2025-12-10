from flask import Flask, jsonify, request
from flask_cors import CORS
from urllib.parse import unquote
from datetime import datetime
import threading, time, os, asyncio

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

import scripts.naver_news_crawler as crawler

app = Flask(__name__)
CORS(app)

MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in Flask")

client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
db = client["stock"]
collection = db["news_crawling"]


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

    # 🔹 캐시 레이어 사용
    result = get_news_with_cache("news", query, page, size, order)
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

    content, total_pages = _sort_and_page(query, page, size, order)

    return jsonify({"content": content, "number": page, "totalPages": total_pages})


def run_crawler():
    while True:
        asyncio.run(crawler.main())
        time.sleep(3600)


if __name__ == "__main__":
    threading.Thread(target=run_crawler, daemon=True).start()
    port = int(os.environ.get("PORT", 8585))
    app.run(host="0.0.0.0", port=port, debug=False)
    
    
#저장된 뉴스들을 날짜 기준으로 정렬·검색해서 React 프론트에 JSON으로 제공하고, 
#동시에 뒤에서 계속 새 뉴스를 수집하게 만드는 것
