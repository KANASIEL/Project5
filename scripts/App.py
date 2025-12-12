from flask import Flask
from apscheduler.schedulers.background import BackgroundScheduler
import asyncio
import os
from datetime import datetime

# 파일들 불러오기
from korea_news import task_korea_crawling 
from global_news import task_global_crawling 

app = Flask(__name__)

# -------------------------------------------
# 스케줄러가 실행할 '진짜' 함수들
# -------------------------------------------
def run_korea_job():
    print("🚀 스케줄러: 국내 뉴스 수집 시작")
    asyncio.run(task_korea_crawling())

def run_global_job():
    print("🚀 스케줄러: 해외 뉴스 수집 시작")
    # ★ 여기도 이제 asyncio.run() 사용!
    asyncio.run(task_global_crawling())

# 스케줄러 설정
scheduler = BackgroundScheduler(daemon=True)

# 시간 설정
scheduler.add_job(run_korea_job, 'interval', minutes=10, id='job_korea')
scheduler.add_job(run_global_job, 'interval', minutes=30, id='job_global')

scheduler.start()

@app.route('/')
def home():
    return "Stock News Crawler Running (All Async Mode) 🚀"

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
    
scheduler.add_job(run_korea_job, 'interval', minutes=10, id='job_korea', next_run_time=datetime.now())
scheduler.add_job(run_global_job, 'interval', minutes=30, id='job_global', next_run_time=datetime.now())