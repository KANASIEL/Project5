from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from urllib.parse import unquote
from datetime import datetime
import threading, time, os

import scripts.naver_news_crawler as crawler

app = Flask(__name__)
CORS(app)  # React CORS 허용

client = MongoClient("mongodb://localhost:27017/")  # 실제 URI 사용
db = client["stock"]
collection = db["news_crawling"]

@app.route("/")
def index():
    return "Flask API is running"

@app.route("/news")
def get_news():
    category = unquote(request.args.get("category", ""))
    page = int(request.args.get("page", 0))
    size = int(request.args.get("size", 5))

    query = {"category": category} if category else {}
    news_list = list(collection.find(query, {"_id": 0}))

    for news in news_list:
        try:
            news["pubDate"] = datetime.strptime(news.get("pubDate","1970-01-01 00:00:00"), "%Y-%m-%d %H:%M:%S")
        except:
            news["pubDate"] = datetime(1970,1,1)
    news_list.sort(key=lambda x: x["pubDate"], reverse=True)

    start = page * size
    end = start + size
    content = news_list[start:end]

    for news in content:
        news["pubDate"] = news["pubDate"].strftime("%Y-%m-%d %H:%M:%S")

    return jsonify({
        "content": content,
        "number": page,
        "totalPages": (len(news_list) + size - 1) // size
    })

def run_crawler():
    while True:
        crawler.main()
        time.sleep(3600)  # 1시간마다 실행

if __name__ == "__main__":
    threading.Thread(target=run_crawler, daemon=True).start()
    port = int(os.environ.get("PORT", 8585))
    app.run(host="0.0.0.0", port=port, debug=True)
