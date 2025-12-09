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


def _sort_and_page(query, page, size, order):
  news_list = list(collection.find(query, {"_id": 0}))

  # pubDate가 datetime이 아니면 기본값
  for news in news_list:
      if not isinstance(news.get("pubDate"), datetime):
          news["pubDate"] = datetime(1970, 1, 1)

  reverse = (order != "asc")
  news_list.sort(key=lambda x: x["pubDate"], reverse=reverse)

  start = page * size
  end = start + size
  content = news_list[start:end]

  for news in content:
      news["pubDate"] = news["pubDate"].strftime("%Y-%m-%d %H:%M:%S")

  return content, (len(news_list) + size - 1) // size


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

    content, total_pages = _sort_and_page(query, page, size, order)

    return jsonify(
        {
            "content": content,
            "number": page,
            "totalPages": total_pages,
        }
    )


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

    return jsonify(
        {
            "content": content,
            "number": page,
            "totalPages": total_pages,
        }
    )


def run_crawler():
    while True:
        asyncio.run(crawler.main())
        time.sleep(3600)


if __name__ == "__main__":
    threading.Thread(target=run_crawler, daemon=True).start()
    port = int(os.environ.get("PORT", 8585))
    app.run(host="0.0.0.0", port=port, debug=False)
