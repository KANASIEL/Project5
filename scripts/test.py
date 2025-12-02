import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
import time

# --- MongoDB 연결 ---
client = MongoClient("mongodb://localhost:27017/")  # 필요 시 IP/포트 변경
db = client["stock"]                           # DB 이름
collection = db["test"]                  # Collection 이름

# --- URL & 헤더 ---
url = "https://finance.naver.com/sise/sise_market_sum.nhn?sosok=0&page=1"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/142.0.0.0 Safari/537.36"
}

# --- HTML 요청 ---
res = requests.get(url, headers=headers)
res.raise_for_status()
soup = BeautifulSoup(res.text, "lxml")

# --- 테이블 파싱 ---
table = soup.find("table", attrs={"class": "type_2"}).find("tbody")
rows = table.find_all("tr")

data_list = []

for row in rows:
    cols = row.find_all("td")
    if len(cols) <= 1:
        continue
    stock = {
        "N": cols[0].get_text(strip=True),
        "종목명": cols[1].get_text(strip=True),
        "현재가": cols[2].get_text(strip=True),
        "전일비": cols[3].get_text(strip=True),
        "등락률": cols[4].get_text(strip=True),
        "액면가": cols[5].get_text(strip=True),
        "시가총액": cols[6].get_text(strip=True),
        "상장주식수": cols[7].get_text(strip=True),
        "외국인비율": cols[8].get_text(strip=True),
        "거래량": cols[9].get_text(strip=True),
        "PER": cols[10].get_text(strip=True),
        "ROE": cols[11].get_text(strip=True)
    }
    data_list.append(stock)
    if len(data_list) >= 50:  # 상위 50개만
        break

# --- MongoDB 저장 ---
if data_list:
    collection.delete_many({})  # 기존 데이터 삭제 (옵션)
    collection.insert_many(data_list)

print("MongoDB 저장 완료! 총:", len(data_list))
