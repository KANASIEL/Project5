import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./NewsList.css";
import { useTranslation } from "react-i18next";

// 🔵 디바운스 유틸
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

function NewsList() {
  const { t } = useTranslation();

  // 🔵 Core States
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [order, setOrder] = useState("desc");
  const [activeCategory, setActiveCategory] = useState("금융");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedNews, setSelectedNews] = useState(null);

  // 🔵 AI & Correction
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [correction, setCorrection] = useState(null);

  // 🔵 UI States
  const [autoKeywords, setAutoKeywords] = useState([]);
  const [trendingKeywords, setTrendingKeywords] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [tradeRanking, setTradeRanking] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeAutoIndex, setActiveAutoIndex] = useState(-1);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const pageSize = 5;
  const SEARCH_CACHE = useRef(new Map()).current;
  const CACHE_TTL = 30000;

  // 🔵 API URLs
  const springBaseUrl = "http://localhost:8585";
  const renderBaseUrl = "https://project5-n56u.onrender.com";
  const fastApiBaseUrl = "http://localhost:8000";

  const CATEGORY_LIST = [
    "금융", "증권", "산업/재계", "중기/벤처", "글로벌 경제", "생활경제", "경제 일반",
  ];

  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialKeyword = params.get("q") || params.get("keyword") || "";
  const initialCategory = params.get("category") || "금융";

  // 🔵 Refs for debouncing
  const correctionTimeoutRef = useRef(null);
  const summaryTimeoutRef = useRef(null);

  // 🔵 Debounced functions
  const debouncedCorrection = useCallback(
    debounce((q) => {
      if (q.trim().length >= 2) fetchCorrection(q);
      else setCorrection(null);
    }, 500),
    []
  );

  const debouncedSummary = useCallback(
    debounce((q) => {
      if (q.trim()) fetchAiSummary(q);
      else setAiSummary(null);
    }, 1000),
    []
  );

  // 🔵 API Functions
  const fetchAutocomplete = async (q) => {
    const trimmed = (q || "").trim();
    if (!trimmed) {
      setAutoKeywords([]);
      return;
    }
    try {
      const res = await fetch(
        `${springBaseUrl}/api/news/autocomplete?query=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) throw new Error("autocomplete error");
      setAutoKeywords(await res.json() || []);
    } catch (e) {
      console.error("❌ autocomplete error", e);
      setAutoKeywords([]);
    }
  };

  const fetchCorrection = async (q) => {
    const trimmed = (q || "").trim();
    if (!trimmed || trimmed.length < 2) {
      setCorrection(null);
      return;
    }
    try {
      const res = await fetch(
        `${fastApiBaseUrl}/news-search-correction?q=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) throw new Error("correction error");
      const data = await res.json();
      if (data.news && data.news.corrected !== trimmed) {
        setCorrection({
          original: trimmed,
          corrected: data.news.corrected,
          source: data.news.source,
        });
      } else {
        setCorrection(null);
      }
    } catch (e) {
      console.error("❌ correction error", e);
      setCorrection(null);
    }
  };

  const fetchAiSummary = async (query) => {
    if (!query?.trim()) {
      setAiSummary(null);
      return;
    }
    try {
      setSummaryLoading(true);
      const response = await fetch(`${fastApiBaseUrl}/chat-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setAiSummary(await response.json());
    } catch (error) {
      console.error("❌ AI 분석 실패:", error);
      setAiSummary({
        query,
        summary: "AI 서버 연결 오류 (localhost:8000 확인)",
        is_stock_related: false,
        model_used: "error",
        explanation_type: "error",
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchNews = async (category, pageNumber = 0, query = "", sortOrder = "desc") => {
    try {
      setLoading(true);
      const searching = query.trim() !== "";
      const cacheKey = searching ? `search:${query.trim()}:${category}:${sortOrder}` : null;

      // 🔵 Cache HIT
      if (searching && cacheKey) {
        const cached = SEARCH_CACHE.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          console.log("✅ 캐시 HIT:", cacheKey);
          setItems(cached.data);
          setPage(0);
          setTotalPages(1);
          setLoading(false);
          return;
        }
      }

      let url;
      if (searching) {
        const qs = new URLSearchParams();
        qs.append("q", query);
        if (category) qs.append("category", category);
        url = `${springBaseUrl}/api/news/search-tfidf?${qs.toString()}`;
      } else {
        url = `${renderBaseUrl}/news?category=${encodeURIComponent(
          category
        )}&page=${pageNumber}&size=${pageSize}&order=${sortOrder}`;
      }

      console.log("🔍 API 호출:", url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (searching) {
        let sortedItems = [...(data || [])];
        if (sortOrder === "accuracy") {
          sortedItems.sort((a, b) => (b.score || 0) - (a.score || 0));
        } else if (sortOrder === "desc") {
          sortedItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        } else if (sortOrder === "asc") {
          sortedItems.sort((a, b) => new Date(a.pubDate) - new Date(b.pubDate));
        }

        // 🔵 Cache 저장
        if (cacheKey) {
          SEARCH_CACHE.set(cacheKey, { data: sortedItems, timestamp: Date.now() });
          console.log("✅ 캐시 저장:", cacheKey, sortedItems.length, "개");
        }
        setItems(sortedItems);
        setPage(0);
        setTotalPages(1);
      } else {
        setItems(data.content || []);
        setPage(data.number || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error("❌ 뉴스 가져오기 실패:", e);
      setIsSearching(false);
    } finally {
      setLoading(false);
    }
  };

  // 🔵 Event Handlers
  const handleSearch = async (overrideKeyword) => {
    const q = (overrideKeyword ?? keyword).trim();
    setPage(0);

    if (!q) {
      setIsSearching(false);
      setOrder("desc");
      setAiSummary(null);
      setCorrection(null);
      await fetchNews(activeCategory, 0, "", "desc");
    } else {
      setIsSearching(true);
      setOrder("accuracy");
      await fetchNews(activeCategory, 0, q, "accuracy");
    }

    const qs = new URLSearchParams();
    qs.append("category", activeCategory);
    if (q) qs.append("q", q);
    navigate(`/news?${qs.toString()}`, { replace: true });
  };

  const handleReSearch = async (term) => {
    const t = (term || "").trim();
    if (!t) return;
    setKeyword(t);
    setPage(0);
    setIsSearching(true);
    setOrder("accuracy");
    await fetchNews(activeCategory, 0, t, "accuracy");

    const qs = new URLSearchParams();
    qs.append("category", activeCategory);
    qs.append("q", t);
    navigate(`/news?${qs.toString()}`, { replace: true });
  };

  const handleCategoryChange = (newCategory) => {
    setActiveCategory(newCategory);
    if (!keyword.trim()) {
      const qs = new URLSearchParams();
      qs.append("category", newCategory);
      navigate(`/news?${qs.toString()}`, { replace: true });
    }
  };

  // 🔵 Recently Viewed
  const RECENT_KEY = "stockNews_recentlyViewed";
  const MAX_RECENT_ITEMS = 5;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      setRecentlyViewed(saved ? JSON.parse(saved) : []);
    } catch (error) {
      console.error("Failed to load recent news:", error);
      setRecentlyViewed([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recentlyViewed));
    } catch (error) {
      console.error("Failed to save recent news:", error);
    }
  }, [recentlyViewed]);

  const addToRecentlyViewed = (newsItem) => {
    const newsData = {
      title: newsItem.title,
      media: newsItem.media,
      _id: newsItem._id,
      link: newsItem.link,
      content: newsItem.content,
      image_url: newsItem.image_url,
      mediaLogo: newsItem.mediaLogo,
      pubDate: newsItem.pubDate,
      score: newsItem.score,
      author: newsItem.author,
    };
    setRecentlyViewed((prevList) => {
      const filteredList = prevList.filter((item) => item.title !== newsData.title);
      return [newsData, ...filteredList].slice(0, MAX_RECENT_ITEMS);
    });
  };

  // 🔵 Effects
  useEffect(() => {
    if (initialKeyword) {
      setKeyword(initialKeyword);
      setIsSearching(true);
      setOrder("accuracy");
      setAiSummary(null);
      setCorrection(null);
      fetchNews(initialCategory || activeCategory, 0, initialKeyword, "accuracy");
      setTimeout(() => {
        debouncedSummary(initialKeyword);
        debouncedCorrection(initialKeyword);
      }, 500);
    } else {
      setOrder("desc");
      fetchNews(initialCategory || activeCategory, 0, "", "desc");
      setAiSummary(null);
      setCorrection(null);
    }
    if (initialCategory) setActiveCategory(initialCategory);
    setIsInitialLoad(false);
  }, [initialKeyword, initialCategory]);

  useEffect(() => {
    if (keyword.trim()) {
      fetchNews(activeCategory, 0, keyword, order);
    } else {
      fetchNews(activeCategory, 0, "", order);
    }
  }, [activeCategory, order, keyword]);

  useEffect(() => {
    fetchTrendingKeywords();
  }, []);

  useEffect(() => {
    setActiveAutoIndex(-1);
  }, [autoKeywords]);

  // 🔵 Side Effects
  useEffect(() => {
    const loadRanking = () => {
      fetch(`${springBaseUrl}/api/krx/ranking/trade`)
        .then((res) => res.json())
        .then(setTradeRanking)
        .catch(() => {});
    };
    loadRanking();
    const id = setInterval(loadRanking, 30000);
    return () => clearInterval(id);
  }, []);

  const fetchTrendingKeywords = async () => {
    try {
      const res = await fetch(`${springBaseUrl}/api/news/trending?hours=24`);
      setTrendingKeywords(await res.json() || []);
    } catch (err) {
      console.error("❌ 인기검색어 로드 실패:", err);
    }
  };

  const highlightText = (text) => {
    if (!keyword || !text) return text;
    const pattern = new RegExp(
      `(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    return text.replace(pattern, `<span class="highlight">$1</span>`);
  };

  const formatRankingValue = (item, field) => {
    const value = item[field];
    if (value == null) return "-";
    const val = Number(value);
    if (["score", "mixedScore"].includes(field)) {
      return (val / 1e8).toLocaleString() + t("hundredMillion");
    }
    if (["marketCap"].includes(field)) {
      return val.toLocaleString() + t("hundredMillion");
    }
    if (field === "volume") return val.toLocaleString();
    if (field === "changeRate") return value.toString();
    return val.toLocaleString();
  };

  const openModal = (news) => {
    setSelectedNews(news);
    addToRecentlyViewed(news);
  };

  const openModalFromRecent = (news) => setSelectedNews(news);
  const closeModal = () => setSelectedNews(null);

  const goToPage = (pageNumber) => {
    if (pageNumber < 0 || pageNumber >= totalPages) return;
    fetchNews(activeCategory, pageNumber, keyword, order);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const listToShow = items;

  return (
    <div className="layout-container">
      {/* 왼쪽 사이드바: 최근 본 기사 */}
      <div className="sidebar-left">
        <div className="sidebar-section">
          <h3 className="sidebar-title">{t("news_2.recentViewed")}</h3>
          <ul className="recent-list">
            {recentlyViewed.length > 0 ? (
              recentlyViewed.map((news, index) => (
                <li key={news._id || index} className="recent-item" onClick={() => openModalFromRecent(news)}>
                  <span className="recent-media">{news.media}</span>
                  <p className="recent-title">{news.title}</p>
                </li>
              ))
            ) : (
              <li className="recent-item" style={{ cursor: "default", padding: "8px" }}>
                <p className="recent-title" style={{ color: "#888" }}>
                  {t("news_2.noRecent")}
                </p>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* 중앙: 뉴스 메인 */}
      <div className="news-main">
        <div className="news-container">
          {/* 검색창 */}
          <div className="search-box">
            <input
              type="text"
              placeholder={t("news_2.searchPlaceholder")}
              value={keyword}
              onChange={(e) => {
                const v = e.target.value;
                setKeyword(v);
                setShowDropdown(true);
                fetchAutocomplete(v);
                // 🔵 Debounced correction & summary
                if (correctionTimeoutRef.current) clearTimeout(correctionTimeoutRef.current);
                correctionTimeoutRef.current = setTimeout(() => debouncedCorrection(v), 500);
                if (summaryTimeoutRef.current) clearTimeout(summaryTimeoutRef.current);
                summaryTimeoutRef.current = setTimeout(() => debouncedSummary(v), 1000);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onKeyDown={(e) => {
                if (!showDropdown || autoKeywords.length === 0) {
                  if (e.key === "Enter") {
                    handleSearch();
                    setShowDropdown(false);
                  }
                  return;
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveAutoIndex((prev) =>
                    prev < autoKeywords.length - 1 ? prev + 1 : 0
                  );
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveAutoIndex((prev) =>
                    prev > 0 ? prev - 1 : autoKeywords.length - 1
                  );
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (activeAutoIndex >= 0) {
                    const selected = autoKeywords[activeAutoIndex];
                    setKeyword(selected);
                    handleSearch(selected);
                    setShowDropdown(false);
                  } else {
                    handleSearch();
                    setShowDropdown(false);
                  }
                }
                if (e.key === "Escape") {
                  setShowDropdown(false);
                  setActiveAutoIndex(-1);
                }
              }}
            />
            {showDropdown && (autoKeywords.length > 0 || trendingKeywords.length > 0) && (
              <div className="keyword-dropdown">
                {autoKeywords.map((word, idx) => (
                  <div
                    key={`auto-${idx}`}
                    className={`dropdown-item autocomplete ${idx === activeAutoIndex ? "active" : ""}`}
                    onMouseEnter={() => setActiveAutoIndex(idx)}
                    onMouseDown={() => {
                      setKeyword(word);
                      handleSearch(word);
                      setShowDropdown(false);
                    }}
                  >
                    🔎 {word}
                  </div>
                ))}
                {trendingKeywords.slice(0, 6).map((k, idx) => (
                  <div
                    key={`trend-${idx}`}
                    className="dropdown-item"
                    onMouseDown={() => {
                      setKeyword(k.keyword);
                      handleSearch(k.keyword);
                    }}
                  >
                    📈 {k.keyword}
                  </div>
                ))}
              </div>
            )}
            <button type="button" className="icon-btn" onMouseDown={() => handleSearch()}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                  stroke="#1e40af"
                  strokeWidth="2"
                />
                <path d="M21 21L16.65 16.65" stroke="#1e40af" strokeWidth="2" />
              </svg>
            </button>
          </div>

          {/* 오타 교정 바 */}
          {correction && (
            <div className="correction-bar">
              <span>혹시 이런 단어를 찾으셨나요?</span>
              <button
                type="button"
                className="correction-link"
                onClick={() => handleReSearch(correction.corrected)}
                style={{ marginLeft: 4, marginRight: 4 }}
              >
                [{correction.corrected}]
              </button>
              <span className="correction-original">(입력한 단어: {correction.original})</span>
            </div>
          )}

          {/* AI 요약 */}
          {keyword.trim() && (
            <div className="ai-summary-section">
              <div className="ai-summary-header">
                <span>AI {t("news_2.analysis")}</span>
                {summaryLoading && <span className="summary-loading">{t("common.loading")}</span>}
              </div>
              {summaryLoading ? (
                <div className="ai-summary-loading">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              ) : aiSummary ? (
                <div className="ai-summary-content">
                  <div className="ai-text">{aiSummary.summary}</div>
                  <div className="ai-meta">
                    <small>
                      {t("news_2.model")}: {aiSummary.model_used} | {t("news_2.explainType")}: {aiSummary.explanation_type}
                    </small>
                  </div>
                </div>
              ) : (
                <div className="ai-summary-empty">검색 결과 분석 준비중...</div>
              )}
            </div>
          )}

          {/* 카테고리 탭 */}
          <div className="category-tabs">
            {CATEGORY_LIST.map((cat) => (
              <button
                key={cat}
                className={cat === activeCategory ? "active" : ""}
                onClick={() => handleCategoryChange(cat)}
              >
                {t(`category.${cat}`)}
              </button>
            ))}
          </div>

          <div className="search-divider"></div>

          {/* 정렬 드롭다운 */}
          <div
            className="sort-dropdown-container"
            onBlur={() => setTimeout(() => setIsSortDropdownOpen(false), 200)}
          >
            <button
              className="sort-dropdown-trigger"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            >
              {order === "accuracy"
                ? t("news_2.sortAccuracy")
                : order === "desc"
                ? t("news_2.sortLatest")
                : t("news_2.sortOldest")}
              <span className="dropdown-arrow">{isSortDropdownOpen ? "▲" : "▼"}</span>
            </button>
            {isSortDropdownOpen && (
              <ul className="sort-dropdown-menu">
                <li
                  className={order === "accuracy" ? "active" : ""}
                  style={{ display: isSearching || keyword.trim() ? "block" : "none" }}
                  onClick={() => {
                    setOrder("accuracy");
                    setPage(0);
                    fetchNews(activeCategory, 0, keyword, "accuracy");
                    setIsSortDropdownOpen(false);
                  }}
                >
                  {t("news_2.sortAccuracy")}
                </li>
                <li
                  className={order === "desc" ? "active" : ""}
                  onClick={() => {
                    setOrder("desc");
                    setPage(0);
                    fetchNews(activeCategory, 0, keyword, "desc");
                    setIsSortDropdownOpen(false);
                  }}
                >
                  {t("news_2.sortLatest")}
                </li>
                <li
                  className={order === "asc" ? "active" : ""}
                  onClick={() => {
                    setOrder("asc");
                    setPage(0);
                    fetchNews(activeCategory, 0, keyword, "asc");
                    setIsSortDropdownOpen(false);
                  }}
                >
                  {t("news_2.sortOldest")}
                </li>
              </ul>
            )}
          </div>

          {/* 뉴스 리스트 */}
          {loading ? (
            <p className="loading-message">{t("common.loadingNews")}</p>
          ) : listToShow.length === 0 ? (
            <p className="empty-message">
              {isSearching
                ? t("news_2.noResult", { keyword })
                : t("news_2.noNews")}
            </p>
          ) : (
            <ul className="news-list">
              {listToShow.map((n, idx) => (
                <li key={n._id || n.link || idx} className="news-card" onClick={() => openModal(n)}>
                  <div className="news-content">
                    {n.image_url ? (
                      <div className="news-image-wrapper">
                        <img src={n.image_url} alt={n.title} className="news-image" />
                      </div>
                    ) : (
                      <div className="news-image-wrapper placeholder">{t("news_2.noImage")}</div>
                    )}
                    <div className="news-text">
                      <h3 dangerouslySetInnerHTML={{ __html: highlightText(n.title || "") }} />
                      <p
                        className="news-summary"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(
                            n.content
                              ? n.content.length > 150
                                ? n.content.slice(0, 150) + "..."
                                : n.content
                              : n.description || ""
                          ),
                        }}
                      />
                      <div className="news-meta">
                        <div className="left-meta">
                          {n.mediaLogo && <img src={n.mediaLogo} className="media-logo" alt="logo" />}
                          {n.author && <span className="news-author">{n.author}</span>}
                          {n.score != null && (
                            <span className="similarity-score">📊 {(n.score * 100).toFixed(0)}%</span>
                          )}
                        </div>
                        <div className="right-meta">
                          {n.pubDate && (
                            <span className="news-date">
                              {new Date(n.pubDate).toLocaleString("ko-KR")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!isSearching && totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => goToPage(page - 1)} disabled={page === 0}>
                {t("prev")}
              </button>
              <span>
                {page + 1} / {totalPages}
              </span>
              <button onClick={() => goToPage(page + 1)} disabled={page + 1 === totalPages}>
                {t("next")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽 사이드바 */}
      <div className="sidebar-right">
        {trendingKeywords.length > 0 && (
          <div className="sidebar-section trending-list-box">
            <div className="ranking-header-with-date">
              <h3 className="sidebar-title" style={{ margin: 0, borderBottom: "none", padding: 0 }}>
                🔥 인기 검색어
              </h3>
              <span className="update-datetime">
                {new Date().toLocaleString("ko-KR", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </span>
            </div>
            <ul className="keyword-list always-open">
              {trendingKeywords.slice(0, 10).map((k, idx) => (
                <li
                  key={idx}
                  className="keyword-item"
                  onClick={() => {
                    setKeyword(k.keyword);
                    handleSearch(k.keyword);
                  }}
                >
                  <span className="keyword-rank">{idx + 1}위</span>
                  <span className="keyword-text">{k.keyword}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="sidebar-section ranking-toggle-box" style={{ marginTop: trendingKeywords.length > 0 ? "15px" : "0" }}>
          <div className="ranking-toggle-header" onClick={() => setIsRankingOpen(!isRankingOpen)}>
            <h3 className="toggle-title">{t("topValueTitle")}</h3>
            <button className="toggle-button">{isRankingOpen ? "▲" : "▼"}</button>
          </div>
          <div className={`ranking-toggle-content ${isRankingOpen ? "open" : ""}`}>
            <ul className="stock-ranking-list">
              {tradeRanking.slice(0, 5).map((item, i) => (
                <li key={item.code || i} className="stock-ranking-item" onClick={() => navigate(`/krx/${item.code}`)}>
                  <div className="stock-ranking-left">
                    <span className="stock-ranking-rank">{t("rank", { num: i + 1 })}</span>
                    <div className="stock-ranking-name">{item.name}</div>
                  </div>
                  <div className="stock-ranking-amount">{formatRankingValue(item, "score")}</div>
                </li>
              ))}
              {tradeRanking.length === 0 && (
                <li className="stock-ranking-item" style={{ justifyContent: "center", cursor: "default" }}>
                  <div className="stock-ranking-name" style={{ color: "#888" }}>
                    {t("common.noData")}
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* 모달 */}
      {selectedNews && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" dangerouslySetInnerHTML={{ __html: selectedNews.title || "" }} />
              <button className="modal-close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-meta">
                <div className="left-meta">
                  {selectedNews.mediaLogo && (
                    <img src={selectedNews.mediaLogo} className="media-logo" alt="media" />
                  )}
                  {selectedNews.author && <span className="news-author">{selectedNews.author}</span>}
                  {selectedNews.link && (
                    <a href={selectedNews.link} target="_blank" rel="noreferrer" className="modal-origin-btn">
                      기사원문
                    </a>
                  )}
                </div>
                <div className="right-meta">
                  {selectedNews.pubDate && (
                    <span className="news-date">
                      {new Date(selectedNews.pubDate).toLocaleString("ko-KR")}
                    </span>
                  )}
                </div>
              </div>
              {selectedNews.image_url && (
                <div className="modal-image-wrapper">
                  <img src={selectedNews.image_url} alt={selectedNews.title} className="modal-image" />
                </div>
              )}
              <div className="modal-article">
                {selectedNews.content &&
                  selectedNews.content
                    .replace(/<br\s*\/?>/gi, "\n")
                    .split(/\n\s*\n|<\/p>/)
                    .map((paragraph, idx) => {
                      const cleanText = paragraph.replace(/<\/?p>/gi, "").trim();
                      if (!cleanText) return null;
                      return (
                        <div key={idx} className="article-paragraph">
                          <div className="paragraph-bar" />
                          <div className="article-text" dangerouslySetInnerHTML={{ __html: cleanText }} />
                        </div>
                      );
                    })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewsList;
