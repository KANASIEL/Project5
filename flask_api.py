from flask import Flask, jsonify, request
from pymongo import MongoClient
from urllib.parse import unquote
from datetime import datetime
import threading
import time
import os

# 크롤러 모듈 임포트
import scripts.naver_news_crawler as crawler  # naver_news_crawler.py 안에 main() 함수가 있어야 함

app = Flask(__name__)
client = MongoClient("MONGO_URI")  # 실제 MongoDB URI
db = client["stock"]
collection = db["news_crawling"]

@app.route("/news")
def get_news():
    category = unquote(request.args.get("category", ""))
    page = int(request.args.get("page", 0))
    size = int(request.args.get("size", 5))

    query = {"category": category} if category else {}
    news_list = list(collection.find(query, {"_id": 0}))

    # 문자열 pubDate → datetime 변환 후 정렬
    for news in news_list:
        try:
            news["pubDate"] = datetime.strptime(news.get("pubDate","1970-01-01 00:00:00"), "%Y-%m-%d %H:%M:%S")
        except:
            news["pubDate"] = datetime(1970,1,1)
    news_list.sort(key=lambda x: x["pubDate"], reverse=True)

    start = page * size
    end = start + size
    content = news_list[start:end]

    # datetime → 문자열
    for news in content:
        news["pubDate"] = news["pubDate"].strftime("%Y-%m-%d %H:%M:%S")

    return jsonify({
        "content": content,
        "number": page,
        "totalPages": (len(news_list) + size - 1) // size
    })

# 크롤러를 주기적으로 실행
def run_crawler():
    while True:
        crawler.main()  # naver_news_crawler.py 안에 main() 함수 있어야 함
        time.sleep(3600)  # 1시간마다 실행

if __name__ == "__main__":
    threading.Thread(target=run_crawler, daemon=True).start()
    port = int(os.environ.get("PORT", 8585))
    app.run(host="0.0.0.0", port=port, debug=True)
