// src/pages/NewsPage/GlobalNews.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./NewsList.css";

function GlobalNews() {
	const MEDIA_LOGOS = {
			CNBC: "https://upload.wikimedia.org/wikipedia/commons/e/e3/CNBC_logo.svg",
			CNN: "https://upload.wikimedia.org/wikipedia/commons/b/b1/CNN.svg",
			BBC: "https://i.namu.wiki/i/_OhuuEOZy3SVA9-nVBijBMBIzQzhcQ4Q2pfDmSRkOYV3QW74TtQknwuhCOIf86BUMCHjt6BQHa8jv5SJzMOH9DAh2PG37pqouSZrWKTkiFQ2chDJLFMmoPv-t03O6wmRcK3_S8zG6K8QwdptRqZObA.svg",
			"Yahoo Finance":
				"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Yahoo%21_Finance_logo_2021.png/250px-Yahoo%21_Finance_logo_2021.png",
		};


  const springBaseUrl = "http://localhost:8585";
  const CATEGORIES = ["전체", "CNBC", "CNN", "BBC", "Yahoo Finance"];
  const RECENT_KEY = "stockNews_recentlyViewed";
  const pageSize = 10;

  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const initialCategory = params.get("category") || "전체";
  const initialKeyword = params.get("q") || "";
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [order, setOrder] = useState("desc");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchMode, setSearchMode] = useState(!!initialKeyword); // 검색중인지 여부

  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    } catch {
      return [];
    }
  });

  // 📄 기본 목록 조회 (카테고리 + 정렬 + 페이징)
  const fetchNews = async (category, pageNumber = 0, sortOrder = order) => {
    try {
      setLoading(true);
      setSearchMode(false);

      const targetCategory = category || "전체";
      const url = `${springBaseUrl}/news/global?page=${pageNumber}&size=${pageSize}&sort=${sortOrder}&category=${targetCategory}`;

      const res = await fetch(url);
      const data = await res.json();

      setItems(data.content || []);
      setPage(data.number ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (e) {
      console.error("❌ 해외 뉴스 로드 실패:", e);
      setItems([]);
      setPage(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 검색 API 호출 (카테고리 + 키워드)
  const fetchSearchResults = async (query, category = activeCategory, pageNumber = 0) => {
    const trimmed = query.trim();
    if (!trimmed) {
      fetchNews(category, 0, order);
      return;
    }

    try {
      setLoading(true);
      setSearchMode(true);

      const targetCategory = category || "전체";

      const url =
        `${springBaseUrl}/news/global/search?` +
        `q=${encodeURIComponent(trimmed)}` +
        `&category=${encodeURIComponent(targetCategory)}` +
        `&sort=${order}` +
        `&page=${pageNumber}` +
        `&size=${pageSize}`;

      const res = await fetch(url);
      const data = await res.json();

      setItems(data.content || []);
      setPage(data.number ?? 0);
      setTotalPages(data.totalPages ?? 1);

    } catch (e) {
      console.error("❌ 해외 뉴스 검색 실패:", e);
      setItems([]);
      setPage(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };



  // 최초 로드 및 URL 바뀔 때
  useEffect(() => {
    // URL 쿼리에서 category, q 동기화
    const urlCategory = params.get("category") || "전체";
    const urlKeyword = params.get("q") || "";

    setActiveCategory(urlCategory);
    setKeyword(urlKeyword);

    if (urlKeyword.trim()) {
      fetchSearchResults(urlKeyword, urlCategory);
    } else {
      fetchNews(urlCategory, 0, order);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // 정렬만 바뀔 때 (검색 모드/목록 모드에 따라 분기)
  useEffect(() => {
    if (searchMode) {
      if (keyword.trim()) {
        fetchSearchResults(keyword, activeCategory);
      }
    } else {
      fetchNews(activeCategory, page, order);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const handleCategoryChange = (newCat) => {
    setActiveCategory(newCat);

    const qs = new URLSearchParams();
    qs.append("region", "global");
    qs.append("category", newCat);
    if (keyword.trim()) qs.append("q", keyword);

    navigate(`/news?${qs.toString()}`, { replace: true });

    // 실제 데이터 로드는 useEffect(location.search)에서 처리됨
  };

  const handleSearchClick = () => {
    const qs = new URLSearchParams();
    qs.append("region", "global");
    qs.append("category", activeCategory);
    if (keyword.trim()) qs.append("q", keyword);

    navigate(`/news?${qs.toString()}`, { replace: true });
    // 역시 데이터 로드는 useEffect(location.search)에서
  };
  
  const resolveMediaLogo = (news) => {
    const source = news.source || news.media || "";

    return (
      MEDIA_LOGOS[source] ||
      (source.includes("BBC") ? MEDIA_LOGOS.BBC : null) ||
      (source.includes("Yahoo") && source.includes("Finance")
        ? MEDIA_LOGOS["Yahoo Finance"]
        : null) ||
      null
    );
  };
  
  const goToPage = (p) => {
    if (p < 0 || p >= totalPages) return;
    setPage(p);

    if (searchMode) {
      fetchSearchResults(keyword, activeCategory, p);
    } else {
      fetchNews(activeCategory, p, order);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const openModal = (news) => {
    const source = news.source || news.media || "";

    const normalized = {
      title: news.title,
      content: news.content,
      link: news.link,
      image_url: news.image_url,
      mediaLogo: resolveMediaLogo(news),
      author: news.author || "",
      pubDate: news.pubDate || news.publishedAt || null,
      source,
    };

    setSelectedNews(normalized);
    addToRecentlyViewed(normalized);
  };


  const closeModal = () => setSelectedNews(null);

  const addToRecentlyViewed = (news) => {
	const source = news.source || news.media || "";


    const data = {
      title: news.title,
      media: source,
      source,
      _id: news._id,
      link: news.link,
      mediaLogo: resolveMediaLogo(news),                 // ✅ 통일
      author: news.author || "",
      pubDate: news.pubDate || news.publishedAt || null,
      image_url: news.image_url,
      content: news.content,
    };

    setRecentlyViewed((prev) => {
      const updated = [data, ...prev.filter((i) => i.title !== data.title)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  };


  return (
    <div className="layout-container">
      {/* 🔹 왼쪽: 최근 본 기사 */}
      <div className="sidebar-left">
        <div className="sidebar-section">
          <h3 className="sidebar-title">⭐ 최근 본 기사</h3>
          <ul className="recent-list">
            {recentlyViewed.map((news, i) => (
              <li
                key={i}
                className="recent-item"
                onClick={() => openModal(news)}
              >
                <span className="recent-media">{news.media}</span>
                <p className="recent-title">{news.title}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 🔹 중앙: 해외 뉴스 메인 */}
      <div className="news-main">
        <div className="news-container">
          {/* 🔍 검색창 */}
		  <div className="search-box">
		    <input
		      type="text"
		      placeholder="삼성전자, 애플, 엔비디아..."
		      value={keyword}
		      onChange={(e) => setKeyword(e.target.value)}
		      onKeyDown={(e) => {
		        if (e.key === "Enter") handleSearchClick();
		      }}
		    />
			<button className="icon-btn search-icon-btn" onClick={handleSearchClick}>
			  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
			    <path
			      d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
			      stroke="#1e40af"
			      strokeWidth="2"
			    />
			    <path
			      d="M21 21L16.65 16.65"
			      stroke="#1e40af"
			      strokeWidth="2"
			    />
			  </svg>
			</button>
		  </div>

          {/* 카테고리 탭 */}
          <div className="category-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={cat === activeCategory ? "active" : ""}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="search-divider"></div>

          {/* 정렬 드롭다운 */}
          <div className="sort-dropdown-container">
            <button
              className="sort-dropdown-trigger"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            >
              {order === "desc" ? "🕒 최신순" : "📅 오래된순"}
			  <span className="dropdown-arrow">{isSortDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {isSortDropdownOpen && (
              <ul className="sort-dropdown-menu">
                <li
                  onClick={() => {
                    setOrder("desc");
                    setIsSortDropdownOpen(false);
                  }}
                >
                  🕒 최신순
                </li>
                <li
                  onClick={() => {
                    setOrder("asc");
                    setIsSortDropdownOpen(false);
                  }}
                >
                  📅 오래된순
                </li>
              </ul>
            )}
          </div>

          {/* 리스트 / 로딩 / 빈 결과 */}
          {loading ? (
            <p className="loading-message">로딩중...</p>
          ) : items.length === 0 ? (
            <p className="empty-message">뉴스가 없습니다.</p>
          ) : (
            <ul className="news-list">
              {items.map((n, i) => (
                <li key={i} className="news-card" onClick={() => openModal(n)}>
                  <div className="news-content">
                    {n.image_url ? (
                      <img src={n.image_url} className="news-image" alt="" />
                    ) : (
                      <div className="news-image-wrapper placeholder">IMG</div>
                    )}
                    <div className="news-text">
                      <h3>{n.title}</h3>
                      <p className="news-summary">
                        {n.content?.substring(0, 120)}...
                      </p>
                      <div className="news-meta">
                        <span
                          style={{
                            fontWeight: "bold",
                            marginRight: "8px",
                            color: "blue",
                          }}
                        >
                          {n.source}
                        </span>
                        <span>
                          {n.pubDate &&
                            new Date(n.pubDate).toLocaleString("ko-KR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* 페이지네이션 (검색 모드일 때는 1페이지만) */}
          {!searchMode && totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => goToPage(page - 1)} disabled={page === 0}>
                이전
              </button>
              <span>
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page + 1 >= totalPages}
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-right"></div>

      {/* 모달 */}
      {selectedNews && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedNews.title}</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-meta">
                <div className="left-meta">
					{resolveMediaLogo(selectedNews) && (
					  <img
					    src={resolveMediaLogo(selectedNews)}
					    alt={selectedNews.source}
					    className="media-logo"
					  />
					)}

                  {selectedNews.author && (
                    <span className="news-author">{selectedNews.author}</span>
                  )}

                  {selectedNews.link && (
                    <a
                      href={selectedNews.link}
                      target="_blank"
                      rel="noreferrer"
                      className="modal-origin-btn"
                    >
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
                  <img
                    src={selectedNews.image_url}
                    alt=""
                    className="modal-image"
                  />
                </div>
              )}

              <div className="modal-article">
                {selectedNews.content &&
                  selectedNews.content
                    .split(/\n|\r/)
                    .map((paragraph, idx) => {
                      const clean = paragraph.trim();
                      if (!clean) return null;
                      return (
                        <div key={idx} className="article-paragraph">
                          <div className="paragraph-bar" />
                          <div className="article-text">{clean}</div>
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

export default GlobalNews;
