import requests
import json
import time
from datetime import datetime, timedelta
from pymongo import MongoClient, ReplaceOne

# =================================================================
# 1. 환경 설정 (API Key 및 DB 정보)
# =================================================================

SERVICE_KEY = "9197e1a826357d75b894b07ec955c0879a53b8d2a3d75d468d7f0d7f7471ee99" 
BASE_URL = "https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo"
MONGO_URI = "mongodb://localhost:27017/" 
DATABASE_NAME = "StockScreenerDB"
COLLECTION_NAME = "stock_daily_prices" 
NUM_OF_ROWS = 1000

# =================================================================
# 2. API 호출 및 JSON 파싱 함수
# =================================================================

def fetch_stock_data(params):
    """
    주식 시세 API를 호출하여 JSON 응답을 Dictionary 형태로 반환합니다.
    """
    
    params['serviceKey'] = SERVICE_KEY
    # JSON 형식으로 수신하도록 설정
    params['resultType'] = 'json' 
    
    try:
        response = requests.get(BASE_URL, params=params, timeout=10)
    except requests.exceptions.RequestException as e:
        print(f"네트워크 오류 발생: {e}")
        return [], 0
        
    if response.status_code == 200:
        try:
            json_dict = json.loads(response.text) 
        except json.JSONDecodeError:
            print(f"JSON 파싱 오류. 응답 내용: {response.text[:100]}...")
            return [], 0
            
        # 응답 구조 접근 (JSON 형식)
        response_body = json_dict.get('response', {})
        header = response_body.get('header', {})
        body = response_body.get('body', {})
        
        result_code = header.get('resultCode')
        if result_code != '00':
            print(f"API 응답 오류 [{result_code}]: {header.get('resultMsg')}")
            return [], 0
            
        items = body.get('items', {}).get('item', [])
        total_count = body.get('totalCount', '0')
        
        if isinstance(items, dict):
            items = [items]
            
        return items, int(total_count)
    else:
        print(f"API 호출 실패: 상태 코드 {response.status_code}")
        return [], 0

# =================================================================
# 3. 특정 기간 데이터 수집 함수
# =================================================================

def collect_data_for_period(begin_date, end_date):
    """
    beginBasDt와 endBasDt를 사용하여 특정 기간의 모든 데이터를 수집합니다.
    """
    
    base_params = {
        'beginBasDt': begin_date,
        'endBasDt': end_date,
        'numOfRows': NUM_OF_ROWS,
    }
    
    all_period_data = [] 

    # 1. 첫 페이지 요청으로 전체 건수(totalCount) 파악
    params = base_params.copy()
    params['pageNo'] = 1
    
    data, total_count = fetch_stock_data(params) 
    
    if total_count == 0:
        print(f"기간 {begin_date} ~ {end_date}: 데이터 없음.")
        return []
    
    total_pages = (total_count + NUM_OF_ROWS - 1) // NUM_OF_ROWS
    print(f"기간 데이터 수집 시작: {begin_date} ~ {end_date}. 총 {total_count}건 ({total_pages} 페이지)")
    
    all_period_data.extend(data) 

    # 2. 나머지 페이지 반복 요청
    for page in range(2, total_pages + 1):
        params['pageNo'] = page
        data, _ = fetch_stock_data(params)
        all_period_data.extend(data)
        print(f" -> {page}/{total_pages} 페이지 수집 완료.")
        time.sleep(0.1) 
        
    return all_period_data

# =================================================================
# 4. MongoDB 연결 및 저장 함수 (Upsert 방식)
# =================================================================

def save_to_mongodb_with_upsert(data):
    """
    수집된 주식 시세 데이터를 MongoDB에 Upsert 방식으로 저장합니다.
    (basDt + srtnCd 조합으로 고유성 유지)
    """
    
    if not data:
        print("저장할 데이터가 없어 MongoDB 작업을 건너뜁니다.")
        return
        
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
    
    processed_data = []
    
    # 데이터 정리 및 형 변환 (숫자형 필드 처리)
    for item in data:
        # 1. 고유 키 (_id) 생성
        item['_id'] = f"{item.get('basDt')}_{item.get('srtnCd')}"
        
        # 2. 주요 시세 항목을 숫자로 변환
        for key in ['clpr', 'vs', 'fltRt', 'mkp', 'hipr', 'lopr', 'trqu', 'trPrc', 'lstgStCnt', 'mrktTotAmt']:
            val = item.get(key)
            if val is not None and val != '':
                try:
                    item[key] = float(val) if key == 'fltRt' or '.' in str(val) else int(val)
                except (ValueError, TypeError):
                    item[key] = None
            
        processed_data.append(item)
    
    # 벌크 쓰기 오퍼레이션 준비 및 실행
    requests_list = [
        ReplaceOne({'_id': doc['_id']}, doc, upsert=True) 
        for doc in processed_data
    ]
    
    try:
        result = collection.bulk_write(requests_list, ordered=False) 
        print("--------------------------------------------------")
        print(f"✅ MongoDB 벌크 저장 완료. {len(processed_data)}건 처리.")
        print(f" -> 새로 삽입된 문서 수: {result.inserted_count}")
        print(f" -> 업데이트/교체된 문서 수: {result.modified_count + result.upserted_count}")
        print("--------------------------------------------------")
    except Exception as e:
        print(f"❌ MongoDB 저장 중 오류 발생: {e}")
    finally:
        client.close()

# =================================================================
# 4. MongoDB 오래된 데이터삭
# =================================================================        

def cleanup_old_data():
    """
    MongoDB에 존재하는 basDt 중 최신 7개 날짜만 남기고
    그 외 날짜의 데이터는 삭제한다.
    (API에서 데이터 없는 날짜는 건드리지 않음)
    """
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]

    # 현재 DB내 존재하는 basDt 목록 조회
    bas_dates = collection.distinct("basDt")

    if not bas_dates:
        print("DB에 날짜 데이터가 없어 정리 작업을 건너뜁니다.")
        return

    # 날짜 내림차순 정렬
    bas_dates_sorted = sorted(bas_dates, reverse=True)

    # 최신 7개는 유지
    keep_dates = bas_dates_sorted[:7]

    # 삭제할 날짜
    remove_dates = bas_dates_sorted[7:]

    if remove_dates:
        result = collection.delete_many({"basDt": {"$in": remove_dates}})
        print(f"🗑️ 오래된 데이터 삭제 완료: {len(remove_dates)}개 날짜 ({result.deleted_count}건)")
    else:
        print("🔄 삭제할 오래된 데이터 없음")

    client.close()

# =================================================================
# 5. 메인 실행 블록 (날짜 계산 로직 수정됨)
# =================================================================

if __name__ == "__main__":
    
    # 🔑 현재 날짜를 기준으로 기간을 동적으로 계산합니다.
    today = datetime.now()
    
    # 1. 종료일: 현재 날짜 - 1일 (어제)
    end_dt = today
    END_DATE = end_dt.strftime("%Y%m%d")
    
    # 2. 시작일: 종료일 - 6일 (총 7일치 데이터)
    begin_dt = end_dt - timedelta(days=7)
    BEGIN_DATE = begin_dt.strftime("%Y%m%d")
    
    print(f"기간 설정: {BEGIN_DATE}부터 {END_DATE}까지의 데이터 수집을 시작합니다.")
    
    # 1) 데이터 수집
    stock_data_list = collect_data_for_period(BEGIN_DATE, END_DATE)

    # 2) MongoDB 저장 (upsert)
    save_to_mongodb_with_upsert(stock_data_list)

    # 3) DB 정리 (존재하는 최신 7일만 유지)
    cleanup_old_data()

