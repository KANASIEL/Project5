from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from kiwipiepy import Kiwi
from datetime import datetime
import re
import json
from openai import OpenAI
from typing import List, Optional
import Levenshtein
# jamo 라이브러리는 더 이상 필요하지 않습니다.

# ---------------- API 키 직접 명시 ----------------
# ⚠️ 주의: 실제 운영 환경에서는 반드시 환경 변수를 사용해야 합니다!
MONGO_URI = "mongodb+srv://kh:1234@cluster0.fbav0ho.mongodb.net/"
# ⭐️ [수정] 여기에 유효한 API 키를 넣어주세요.
# ----------------------------------------------------------------------

app = FastAPI()

# ---------------- CORS 설정 ----------------
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- MongoDB 및 LLM 클라이언트 전역 변수 초기화 ----------------
client: MongoClient = None
db = None
krx_col = None
naver_kospi_col = None
naver_kosdaq_col = None
client_llm: Optional[OpenAI] = None

@app.on_event("startup")
def startup_db_client():
    """애플리케이션 시작 시 DB 및 LLM 연결/객체 설정"""
    global client, db, krx_col, naver_kospi_col, naver_kosdaq_col, client_llm

    try:
        # 1. MongoDB 연결
        client = MongoClient(MONGO_URI)
        client.admin.command('ping')
        db = client["stock"]
        krx_col = db["krx"]
        naver_kospi_col = db["naver_kospi"]
        naver_kosdaq_col = db["naver_kosdaq"]
        print("MongoDB 연결 성공.")

        # 2. OpenAI 클라이언트 초기화 (LLM)
        if not OPENAI_API_KEY:
            raise ValueError("OpenAI API 키가 설정되지 않았습니다.")

        client_llm = OpenAI(api_key=OPENAI_API_KEY)
        print("OpenAI 클라이언트 준비 완료.")

    except Exception as e:
        print(f"초기화 실패: {e}")
        detail_msg = "서비스 초기화 실패. DB 연결 또는 API 키를 확인하세요."
        if "API key" in str(e) or isinstance(e, ValueError):
            detail_msg = "OpenAI API 키 설정 오류. 키를 확인하세요."
        raise HTTPException(status_code=503, detail=detail_msg)

@app.on_event("shutdown")
def shutdown_db_client():
    """애플리케이션 종료 시 DB 연결 해제"""
    global client
    if client:
        client.close()
        print("MongoDB 연결 해제.")

# ---------------- 형태소 분석기 ----------------
kiwi = Kiwi()

# ---------------- 모델 정의 ----------------
class StockSearchResponse(BaseModel):
    code: str
    name: str
    market: str
    current_price: int | float | None = None
    change: str | None = None
    change_rate: str | None = None
    volume: int | None = None
    market_cap: int | None = None
    foreign_ratio: float | None = None
    per: float | None = None
    roe: float | None = None
    crawled_at: str | None = None
    chosung: str | None = None
    crawl_date: str | None = None

class SearchSuggestionResponse(BaseModel):
    results: list[StockSearchResponse]
    suggestion_original_query: str | None = None
    suggestion_converted_text: str | None = None
    suggestion_message: str | None = None
    suggestion_list: List[str] | None = None
    gpt_inferred_word: str | None = None

# ---------------- 유틸리티 함수 정의 ----------------
CHOSUNG_LIST = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"]

def get_chosung(text: str) -> str:
    """한글 문자를 초성으로 변환"""
    result = []
    for char in text:
        if "가" <= char <= "힣":
            code = ord(char) - 0xAC00
            result.append(CHOSUNG_LIST[code // 588])
        else:
            result.append(char)
    return "".join(result)

def contains_only_chosung(text: str) -> bool:
    """텍스트가 전부 초성으로만 이루어져 있는지 확인"""
    return bool(re.match(r'^[ㄱ-ㅎ]+$', text))

def extract_korean_text(text: str) -> str:
    """텍스트에서 완성형 한글 문자만 추출"""
    return "".join(char for char in text if "가" <= char <= "힣")

def contains_chosung_mixed_with_korean(text: str) -> bool:
    """초성 자모와 완성형 한글이 모두 포함되어 있는지 확인"""
    has_chosung_jamo = bool(re.search(r'[ㄱ-ㅎ]', text))
    has_korean_syllable = bool(re.search(r'[가-힣]', text))
    return has_chosung_jamo and has_korean_syllable

def get_levenshtein_similarity(str1: str, str2: str) -> float:
    """두 문자열의 Levenshtein 거리를 기반으로 유사도 (0.0~1.0)를 계산"""
    distance = Levenshtein.distance(str1, str2)
    max_len = max(len(str1), len(str2))
    if max_len == 0:
        return 0.0
    # 유사도 = 1.0 - (거리 / 최대 길이)
    return 1.0 - (distance / max_len)

# QWERTY 영문 자판을 두벌식 한글 자모로 매핑
KEY_MAP = {
    'q': 'ㅂ', 'w': 'ㅈ', 'e': 'ㄷ', 'r': 'ㄱ', 't': 'ㅅ', 'y': 'ㅛ', 'u': 'ㅕ', 'i': 'ㅑ', 'o': 'ㅐ', 'p': 'ㅔ',
    'a': 'ㅁ', 's': 'ㄴ', 'd': 'ㅇ', 'f': 'ㄹ', 'g': 'ㅎ', 'h': 'ㅗ', 'j': 'ㅓ', 'k': 'ㅏ', 'l': 'ㅣ',
    'z': 'ㅋ', 'x': 'ㅌ', 'c': 'ㅊ', 'v': 'ㅍ', 'b': 'ㅠ', 'n': 'ㅜ', 'm': 'ㅡ',
    'Q': 'ㅃ', 'W': 'ㅉ', 'E': 'ㄸ', 'R': 'ㄲ', 'T': 'ㅆ', 'Y': 'ㅛ', 'U': 'ㅕ', 'I': 'ㅑ', 'O': 'ㅒ', 'P': 'ㅖ',
    'A': 'ㅁ', 'S': 'ㄴ', 'D': 'ㅇ', 'F': 'ㄹ', 'G': 'ㅎ', 'H': 'ㅗ', 'J': 'ㅓ', 'K': 'ㅏ', 'L': 'ㅣ',
    'Z': 'ㅋ', 'X': 'ㅌ', 'C': 'ㅊ', 'V': 'ㅍ', 'B': 'ㅠ', 'N': 'ㅜ', 'M': 'ㅡ',
}

def eng_to_kor_keyboard(text: str) -> str:
    """영문 입력 문자열을 한글 키보드 배열에 따라 자모로 변환"""
    return "".join(KEY_MAP.get(c, c) for c in text)

# ---------------- GPT 기반 종목명 제안 함수 (종목 목록 반환) ----------------
def get_gpt_suggestions(original_query: str, converted_query: str, best_match_names: List[str]) -> List[str]:
    """GPT-4o-mini를 호출하여 검색 의도를 보정하고 유력 종목명 리스트를 제안 받습니다."""
    global client_llm
    if client_llm is None:
        print("LLM 클라이언트가 초기화되지 않았습니다. API 키를 확인하세요.")
        return []

    match_list_str = ", ".join(best_match_names) if best_match_names else "제시할 참고 종목 없음."

    prompt = f"""
당신은 한국 주식 시장 상장 종목명 검색 오류를 보정하는 전문 보조 AI입니다.

사용자의 입력 쿼리는 키보드 오타로 인해 잘못 입력된 상태입니다. 아래 주어진 정보를 바탕으로 **가장 가능성이 높은 3~5개의 한국 상장 종목명**을 예측하세요. 특히 **[1차 자모 유사도 기반 참고 리스트]** 내에서 정답을 찾으려는 노력을 기울이세요.

**--- 지침 및 제약 조건 ---**
1. 예측 대상: 가장 가능성이 높은 **3~5개의 종목명**을 예측해야 합니다.
2. 출력 형식: 예측된 종목명을 요소로 담는 **JSON 배열 형식**으로만 응답해야 합니다.
3. 출력 제약: JSON 배열 외의 어떠한 설명이나 부가 텍스트도 절대 포함해서는 안 됩니다.
    
**--- 입력 정보 ---**
- 입력된 쿼리 (영문): '{original_query}'
- 변환된 쿼리 (한글 자모): '{converted_query}'
- **[1차 자모 유사도 기반 참고 리스트]: {match_list_str}** **--- 실제 요청에 대한 예측 (JSON 배열로만 응답) ---**
"""
    try:
        response = client_llm.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {"role": "system", "content": "You are a specialized AI for correcting misspelled Korean stock names and must output ONLY a JSON array containing up to 5 suggested stock names."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.5,
            max_tokens=100
        )

        json_string = response.choices[0].message.content.strip()
        parsed_data = json.loads(json_string)

        if isinstance(parsed_data, list):
            return [name.strip() for name in parsed_data if isinstance(name, str) and name.strip()]

        if isinstance(parsed_data, dict):
            for key in parsed_data:
                if isinstance(parsed_data[key], list):
                    return [name.strip() for name in parsed_data[key] if isinstance(name, str) and name.strip()]

        return []

    except Exception as e:
        print(f"OpenAI API 호출 또는 JSON 파싱 실패: {e}")
        return []


# ---------------- 🌟 [새 함수] GPT 기반 일반 단어 추론 함수 (단어 하나 반환) 🌟 ----------------
def get_gpt_inferred_word(original_query: str, converted_query: str) -> str:
    """GPT-4o-mini를 호출하여 키보드 오타를 기반으로 가장 유력한 한국어 일반 단어를 하나 추론받습니다."""
    global client_llm
    if client_llm is None:
        return ""

    prompt = f"""
당신은 한국어 키보드 오타를 전문적으로 복원하는 AI입니다.

사용자의 입력 쿼리는 키보드 오타로 인해 잘못 입력된 상태입니다. 아래 주어진 정보를 바탕으로 사용자가 의도했을 **가장 가능성이 높은 한국어 일반 명사(단어) 하나**만 예측하세요.

**--- 지침 및 제약 조건 ---**
1. 예측 대상: 가장 가능성이 높은 **한국어 일반 명사 (단어) 하나**만 예측해야 합니다.
2. 출력 형식: 예측된 단어 **하나**만 응답해야 합니다. JSON 형식이나 부가 설명은 절대 포함하지 마세요.
3. 예시: 입력이 'tkatjd'이면 출력은 '삼성'이어야 합니다. 입력이 'rnas'이면 출력은 '가나'여야 합니다.
    
**--- 입력 정보 ---**
- 입력된 쿼리 (영문 오타): '{original_query}'
- 변환된 쿼리 (한글 자모): '{converted_query}'
"""
    try:
        response = client_llm.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {"role": "system", "content": "You are a specialized AI for correcting misspelled Korean words and must output ONLY the single most likely Korean noun."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0, # 정확한 추론을 위해 0.0 설정
            max_tokens=20
        )
        inferred_word = response.choices[0].message.content.strip()

        # 한국어 완성형 2글자 이상인 경우에만 유효하다고 판단
        if re.search(r'[가-힣]{2,}', inferred_word):
            return inferred_word

        return ""

    except Exception as e:
        print(f"OpenAI API 호출 또는 추론 실패: {e}")
        return ""

# ---------------- 검색 API (GPT 기반 제안 통합 버전) ----------------
@app.get("/search", response_model=SearchSuggestionResponse)
def search_stocks(
        q: str = Query(..., min_length=1),
        use_chosung: bool = False
):
    global krx_col, naver_kospi_col, naver_kosdaq_col
    if krx_col is None:
        raise HTTPException(status_code=503, detail="데이터베이스가 준비되지 않았습니다.")

    q = q.strip()
    if not q:
        return SearchSuggestionResponse(results=[])

    # 1. 영타 자동 변환 및 플래그 설정
    q_original = q
    q_converted_for_search = q
    is_eng_converted = False

    if re.match(r'^[a-zA-Z]+$', q):
        q_converted_for_search = eng_to_kor_keyboard(q)
        is_eng_converted = True

    q = q_converted_for_search

    is_pure_chosung = contains_only_chosung(q)
    is_hybrid_search = contains_chosung_mixed_with_korean(q) or is_eng_converted

    # 2. KRX 컬렉션에서 종목 코드 검색 (메인 검색 로직)
    filter_query = {}

    if use_chosung or is_pure_chosung:
        filter_query = {"chosung": {"$regex": re.escape(q), "$options": "i"}}
    elif is_hybrid_search:
        chosung_pattern = get_chosung(q)
        and_filters = []
        and_filters.append({"chosung": {"$regex": re.escape(chosung_pattern), "$options": "i"}})
        if not is_eng_converted:
            korean_chars = list(extract_korean_text(q))
            if korean_chars:
                char_filters = [{"name": {"$regex": re.escape(char), "$options": "i"}} for char in korean_chars]
                and_filters.extend(char_filters)
        filter_query = {"$and": and_filters}
    else:
        # 일반 키워드 검색 (형태소 분석 사용)
        tokens = kiwi.tokenize(q)
        keywords = [t.form for t in tokens if t.tag in ["NNG", "NNP", "SL", "SN", "SH"]]
        if not keywords: keywords = [q]
        filter_query = {"$or": [{"name": {"$regex": re.escape(kw), "$options": "i"}} for kw in keywords]}

    krx_results = list(krx_col.find(filter_query, {"_id": 0}))
    target_codes = [doc['code'] for doc in krx_results if 'code' in doc]

    # 3. Naver 시세 데이터 병합
    price_map = {}
    processed_results = []

    if naver_kospi_col is not None and naver_kosdaq_col is not None:
        price_filter = {"code": {"$in": target_codes}}
        kospi_prices = list(naver_kospi_col.find(price_filter, {"_id": 0}))
        kosdaq_prices = list(naver_kosdaq_col.find(price_filter, {"_id": 0}))
        price_map = {doc['code']: doc for doc in kospi_prices + kosdaq_prices}

        for krx_doc in krx_results:
            code = krx_doc.get('code')
            merged_doc = {**krx_doc}

            if code in price_map:
                naver_doc = price_map[code]
                merged_doc = {**naver_doc, **krx_doc}
                merged_doc['name'] = krx_doc.get('name', naver_doc.get('name'))
                merged_doc['chosung'] = krx_doc.get('chosung')
                merged_doc['market'] = krx_doc.get('market', naver_doc.get('market'))

            if isinstance(merged_doc.get("crawled_at"), datetime):
                merged_doc["crawled_at"] = merged_doc["crawled_at"].isoformat()
            if 'market' not in merged_doc or merged_doc['market'] is None:
                merged_doc['market'] = 'UNKNOWN'

            processed_results.append(merged_doc)
    else:
        processed_results = krx_results

    # ---------------- 🌟 4. GPT 기반 유사 종목 제안 로직 (단어 추론 분리) 🌟 ----------------
    suggestion_list = None
    suggestion_message = None

    # 💡 [핵심 수정]: GPT에게 일반 단어만 추론하게 요청
    gpt_inferred_word = None

    # 검색 결과가 없고, 순수 초성 검색이 아니며, 길이가 2자 이상일 때 오타 보정 시도
    if (not processed_results) and (not is_pure_chosung) and (len(q_original) >= 2):

        suggested_names = []
        best_match_names = []
        q_search_jamo = get_chosung(q_converted_for_search)

        if q_search_jamo and krx_col is not None:
            # 1차 자모 유사도 계산 로직
            all_krx_stocks = list(krx_col.find({}, {"_id": 0, "name": 1, "chosung": 1}))

            similarity_scores = []
            for stock in all_krx_stocks:
                stock_jamo = stock.get('chosung', '')
                if stock_jamo:
                    similarity = get_levenshtein_similarity(q_search_jamo, stock_jamo)
                    similarity_scores.append((similarity, stock['name']))

            similarity_scores.sort(key=lambda x: x[0], reverse=True)
            best_match_names = [name for score, name in similarity_scores if score > 0.3][:5]

        # 1. 영타 오타인 경우: GPT에게 "삼성"과 같은 일반 단어 하나를 추론하게 요청
        if is_eng_converted:
            print(f"DEBUG_INFERRED_WORD_CALL: Attempting to call GPT for word inference: original='{q_original}' and converted='{q_converted_for_search}'")
            gpt_inferred_word = get_gpt_inferred_word(q_original, q_converted_for_search)

            # 2. GPT에게 종목명 목록을 요청 (기존 함수 사용)
            suggested_names = get_gpt_suggestions(q_original, q_converted_for_search, best_match_names)

        # 한글 오타인 경우 (기존 로직 유지)
        elif not is_eng_converted:
            suggested_names = get_gpt_suggestions(q_original, q_original, best_match_names)

        if suggested_names:
            suggestion_list = suggested_names

            # 🌟 [최종 메시지]: GPT가 추론한 일반 단어('삼성')를 먼저 제시
            if is_eng_converted and gpt_inferred_word:
                suggestion_message = (
                    f"혹시 **{gpt_inferred_word}**을(를) 검색하셨나요? "
                    f"가장 유력한 종목은 **{suggested_names[0]}**입니다. "
                    f"[총 {len(suggestion_list)}개 유사 종목 확인]"
                )
                print(f"DEBUG_INFERRED_WORD_RESULT: Inferred word is '{gpt_inferred_word}'")
            else:
                # 일반 단어 추론 실패 또는 한글 오타 시: 기존 GPT 종목명 제안 방식 유지
                top_suggestion = suggested_names[0]
                suggestion_message = (
                    f"혹시 **{top_suggestion}**을(를) 포함한 유사 종목 (총 {len(suggestion_list)}개)을 찾으시나요? [클릭하여 확인]"
                )

            print(f"DEBUG_GPT_SUGGESTION: GPT suggested {suggested_names}")

    # 5. 최종 응답 반환
    return SearchSuggestionResponse(
        results=processed_results,
        suggestion_original_query=q_original,
        suggestion_converted_text=q_converted_for_search if is_eng_converted else None,
        suggestion_message=suggestion_message,
        suggestion_list=suggestion_list,
        gpt_inferred_word = gpt_inferred_word
    )