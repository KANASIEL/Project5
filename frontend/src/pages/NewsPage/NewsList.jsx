import React, { useEffect, useState } from "react";
import "./NewsList.css";

function NewsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedNews, setSelectedNews] = useState(null);

  const [activeCategory, setActiveCategory] = useState("금융");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [order, setOrder] = useState("desc"); // 'desc' 최신순, 'asc' 오래된순

  const pageSize = 5;

  const CATEGORY_LIST = [
    "금융",
    "증권",
    "산업/재계",
    "중기/벤처",
    "글로벌 경제",
    "생활경제",
    "경제 일반",
  ];

  const highlightText = (text) => {
    if (!keyword || !text) return text;
    const pattern = new RegExp(`(${keyword})`, "gi");
    return text.replace(pattern, `<span class="highlight">$1</span>`);
  };

  const fetchNews = async (
    category,
    pageNumber = 0,
    query = keyword,
    sortOrder = order
  ) => {
    try {
      setLoading(true);

      const searching = query.trim() !== "";
      setIsSearching(searching);

      const baseUrl = "https://project5-n56u.onrender.com";

      const url = searching
        ? `${baseUrl}/news/search?category=${encodeURIComponent(
            category
          )}&q=${encodeURIComponent(query)}&page=${pageNumber}&size=${pageSize}&order=${sortOrder}`
        : `${baseUrl}/news?category=${encodeURIComponent(
            category
          )}&page=${pageNumber}&size=${pageSize}&order=${sortOrder}`;

      console.log("📡 요청 URL:", url);

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      setItems(data.content || []);
      setPage(data.number || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error("뉴스 가져오기 실패:", e);
      setIsSearching(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 처음 마운트/카테고리/정렬 변경 시 0페이지부터
    fetchNews(activeCategory, 0, keyword, order);
  }, [activeCategory, order]);

  const handleSearch = () => {
    setPage(0);
    if (keyword.trim() === "") {
      setIsSearching(false);
      fetchNews(activeCategory, 0, "", order);
    } else {
      fetchNews(activeCategory, 0, keyword, order);
    }
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const openModal = (news) => setSelectedNews(news);
  const closeModal = () => setSelectedNews(null);

  const goToPage = (pageNumber) => {
    if (pageNumber < 0 || pageNumber >= totalPages) return;
    fetchNews(activeCategory, pageNumber, keyword, order); // 검색/일반 모두 여기로
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const groupedItems = items.reduce((acc, news) => {
    const cat = news.category || "기타";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(news);
    return acc;
  }, {});

  const listToShow = isSearching ? items : groupedItems[activeCategory] || [];

  return (
    <div className="news-container">

      <div className="search-box">
        <input
          type="text"
          placeholder="삼성전자, 애플, 엔비디아..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleEnter}
        />
        <button className="icon-btn" onClick={handleSearch}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3
                   C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
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

      <div className="category-tabs">
        {CATEGORY_LIST.map((cat) => (
          <button
            key={cat}
            className={cat === activeCategory ? "active" : ""}
            onClick={() => {
              setActiveCategory(cat);
              setPage(0);
              if (keyword.trim() !== "") {
                fetchNews(cat, 0, keyword, order);
              } else {
                fetchNews(cat, 0, "", order);
              }
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="search-divider"></div>

      {/* 정렬 드롭다운 */}
      <div className="sort-dropdown">
        <select
          value={order}
          onChange={(e) => {
            const newOrder = e.target.value;
            setOrder(newOrder);
            setPage(0);
            fetchNews(activeCategory, 0, keyword, newOrder);
          }}
        >
          <option value="desc">🕒 최신순</option>
          <option value="asc">📅 오래된순</option>
        </select>
      </div>

      {/* {loading && <p>불러오는 중...</p>} */}

      {/* 리스트 / 빈 상태 처리 */}
      {listToShow.length === 0 && !loading ? (
        <p className="empty-message">
          {isSearching
            ? "해당 검색어로 찾은 뉴스가 없어요! 😢"
            : "아직 이 카테고리에 뉴스가 올라오지 않았어요 📰✨"}
        </p>
      ) : (
        <ul className="news-list">
          {listToShow.map((n) => (
            <li
              key={n._id || n.link}
              className="news-card"
              onClick={() => openModal(n)}
            >
              <div className="news-content">
                {n.image_url ? (
                  <div className="news-image-wrapper">
                    <img
                      src={n.image_url}
                      alt={n.title}
                      className="news-image"
                    />
                  </div>
                ) : (
                  <div className="news-image-wrapper placeholder">
                    이미지 없음
                  </div>
                )}

                <div className="news-text">
                  <h3
                    dangerouslySetInnerHTML={{
                      __html: highlightText(n.title),
                    }}
                  />

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
                      {n.mediaLogo && (
                        <img src={n.mediaLogo} className="media-logo" />
                      )}
                      {n.author && (
                        <span className="news-author">{n.author}</span>
                      )}
                    </div>
                    <div className="right-meta">
                      {n.pubDate && (
                        <span className="news-date">
                          {new Date(n.pubDate).toLocaleString()}
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

      {/* 검색 중에도 페이지네이션 표시 */}
      <div className="pagination">
        <button onClick={() => goToPage(page - 1)} disabled={page === 0}>
          이전
        </button>
        <span>
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages - 1}
        >
          다음
        </button>
      </div>

      {selectedNews && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              X
            </button>

            <h2 dangerouslySetInnerHTML={{ __html: selectedNews.title }} />

            <div className="modal-meta">
              <div className="left-meta">
                {selectedNews.mediaLogo && (
                  <img src={selectedNews.mediaLogo} className="media-logo" />
                )}
                {selectedNews.author && (
                  <span className="news-author">{selectedNews.author}</span>
                )}
              </div>
              <div className="right-meta">
                {selectedNews.pubDate && (
                  <span className="news-date">
                    {new Date(selectedNews.pubDate).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {selectedNews.image_url && (
              <div className="modal-image-wrapper">
                <img
                  src={selectedNews.image_url}
                  alt={selectedNews.title}
                  className="modal-image"
                />
              </div>
            )}

            <p
              className="modal-content-text"
              dangerouslySetInnerHTML={{
                __html: selectedNews.content,
              }}
            />

            {selectedNews.link && (
              <a
                href={selectedNews.link}
                target="_blank"
                rel="noreferrer"
                className="modal-link"
              >
                원문 보기
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NewsList;
