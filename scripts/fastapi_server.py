# C:/dev/work_springboot/Project5/scripts/fastapi_server.py
from typing import List, Dict, Any
import time
import os
import json
import hashlib
import pickle

from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

import redis

# ---------- 모듈 ----------
from nlp_search import enhanced_tokenize
from tfidf_rank_lib import rank_with_tfidf
from ime_converter import to_hangul
from chat_summary_lib import build_summary, ChatSummaryResponse
from news_typo_corrector import best_news_correction

# ---------- 환경변수 ----------
load_dotenv()

# ---------- FastAPI ----------
app = FastAPI(title="Project5 AI Search API", version="2.3")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Redis ----------
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
CACHE_TTL = 300  # 5분

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=0,
    decode_responses=False
)

# ---------- Cache Utils ----------
def get_cache(key: str):
    try:
        data = redis_client.get(key)
        if data:
            return pickle.loads(data)
    except Exception:
        pass
    return None


def set_cache(key: str, value: Any, ttl: int = CACHE_TTL):
    try:
        redis_client.setex(key, ttl, pickle.dumps(value))
    except Exception:
        pass


def make_docs_hash(documents: List[Dict[str, Any]]) -> str:
    ids = [
        str(d["id"])
        for d in documents
        if "id" in d and d["id"] is not None
    ]
    ids.sort()
    return hashlib.md5(",".join(ids).encode()).hexdigest()
    

# ---------- NLP ----------
class NlpRequest(BaseModel):
    query: str


@app.post("/nlp-analyze")
def nlp_analyze(req: NlpRequest):
    tokens = enhanced_tokenize(req.query)
    return {"tokens": tokens, "count": len(tokens)}


# ---------- TF-IDF ----------
class TfidfRequest(BaseModel):
    query: str
    documents: List[Dict[str, Any]]


@app.post("/tfidf-rank")
def tfidf_rank(req: TfidfRequest):
    original_query = req.query.strip()
    
    # 1️⃣ 오타 교정 먼저 (캐시 적용됨)
    correction = best_news_correction(original_query)
    corrected_query = correction["corrected"].strip().lower()
    
    # 2️⃣ 캐시 키 생성
    docs_hash = make_docs_hash(req.documents)
    cache_key = f"tfidf:{corrected_query}:{docs_hash}"
    
    # 3️⃣ 캐시 확인
    cached = get_cache(cache_key)
    if cached:
        cached["cached"] = True
        print("⚡ TF-IDF cache HIT")
        return cached
    
    print("🐢 TF-IDF cache MISS - 계산 중...")
    
    # 4️⃣ TF-IDF 실행
    ranked = rank_with_tfidf(corrected_query, req.documents)
    
    result = {
        "original_query": original_query,
        "corrected_query": corrected_query,
        "correction": correction,
        "ranked_docs": ranked,
        "total": len(ranked),
        "cached": False
    }
    
    # 5️⃣ 캐시 저장
    set_cache(cache_key, result)
    print(f"✅ TF-IDF 캐시 저장: {cache_key[:30]}...")
    
    return result



# ---------- IME ----------
@app.get("/ime-convert")
def ime_convert(q: str):
    return {"original": q, "converted": to_hangul(q or "")}


# ---------- 뉴스 오타 교정 ----------
@app.get("/news-search-correction")
def news_search_correction(q: str):
    original = (q or "").strip()
    ime_q = to_hangul(original)
    base_q = ime_q or original

    cache_key = f"news_corr:{base_q}"

    cached = get_cache(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    news_corr = best_news_correction(base_q)

    result = {
        "original": original,
        "ime_converted": ime_q,
        "news": news_corr,
        "cached": False
    }

    set_cache(cache_key, result)
    return result


# ---------- Chat Summary ----------
class SummaryRequest(BaseModel):
    query: str


@app.post("/chat-summary", response_model=ChatSummaryResponse)
def chat_summary(req: SummaryRequest):
    return build_summary(req.query)


# ---------- Health ----------
@app.get("/health")
def health_check():
    return {
        "status": "🟢 healthy",
        "redis": "connected" if redis_client.ping() else "disconnected",
        "version": "2.3"
    }


# ---------- Run ----------
if __name__ == "__main__":
    print("🚀 Project5 AI Search API v2.3")
    print("⚡ TF-IDF 캐시 키 최적화 완료")
    uvicorn.run(
        "fastapi_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
