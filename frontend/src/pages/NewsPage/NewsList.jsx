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

  /** 🔍 검색 결과 하이라이트 */
  const highlightText = (text) => {
    if (!keyword || !text) return text;
    const pattern = new RegExp(`(${keyword})`, "gi");
    return text.replace(pattern, `<span class="highlight">$1</span>`);
  };

  /** 📌 뉴스 불러오기 (카테고리/검색 통합) */
  const fetchNews = async (category, pageNumber = 0, query = keyword) => {
    try {
      setLoading(true);

      const searching = query.trim() !== "";
      setIsSearching(searching);

      const baseUrl = "https://project5-n56u.onrender.com";

      const url = searching
        ? `${baseUrl}/news/search?q=${encodeURIComponent(query)}&page=${pageNumber}&size=${pageSize}`
        : `${baseUrl}/news?category=${encodeURIComponent(
            category
          )}&page=${pageNumber}&size=${pageSize}&sort=date`;

      console.log("📡 요청 URL:", url);

      const res = await fetch(url);
      if (!res.ok) {
        // 404/500이면 검색 모드 끄고 기존 리스트 유지
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      setItems(data.content || []);
      setPage(data.number || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error("뉴스 가져오기 실패:", e);
      // 에러 나면 검색 모드 해제
      setIsSearching(false);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    if (!isSearching) {
      fetchNews(activeCategory, 0);
    }
  }, [activeCategory]);

  /** 검색 실행 */
  const handleSearch = () => {
    if (keyword.trim() === "") {
      setIsSearching(false);
      fetchNews(activeCategory, 0);
    } else {
      fetchNews(activeCategory, 0, keyword);
    }
  };

  /** 검색 엔터키 */
  const handleEnter = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const openModal = (news) => setSelectedNews(news);
  const closeModal = () => setSelectedNews(null);

//  const summarizeContent = (content) => {
//    try {
//      if (!content) return "";
//
//      // 문자열이면 그대로 사용
//      if (typeof content === "string") {
//        const clean = content.replace(/<[^>]+>/g, ""); // HTML 태그 제거
//        return clean.length > 100 ? clean.slice(0, 100) + "..." : clean;
//      }
//
//      // 객체 또는 배열이면 안전하게 문자열 변환
//      const text = JSON.stringify(content, null, 2);
//      return text.length > 100 ? text.slice(0, 100) + "..." : text;
//    } catch (err) {
//      console.error("summarizeContent error:", err);
//      return "";
//    }
//  };


  const goToPage = (pageNumber) => {
    if (!isSearching && pageNumber >= 0 && pageNumber < totalPages) {
      fetchNews(activeCategory, pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  
  // items를 카테고리별 그룹으로 변환
  const groupedItems = items.reduce((acc, news) => {
    const cat = news.category || "기타";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(news);
    return acc;
  }, {});

  // 현재 activeCategory에 맞는 뉴스
  const filteredItems = groupedItems[activeCategory] || [];


  return (
    <div className="news-container">
	  <h2>{activeCategory} 뉴스</h2>


      {/* 🔍 검색바 */}
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
              stroke="#1976ff"
              strokeWidth="2"
            />
            <path
              d="M21 21L16.65 16.65"
              stroke="#1976ff"
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>

	  {/* 카테고리: 항상 보여주기 */}
	  <div className="category-tabs">
	    {CATEGORY_LIST.map((cat) => (
	      <button
	        key={cat}
	        className={cat === activeCategory ? "active" : ""}
	        onClick={() => {
	          setActiveCategory(cat);
	          setPage(0);
	        }}
	      >
	        {cat}
	      </button>
	    ))}
	  </div>

      {loading && <p>불러오는 중...</p>}

	  <ul className="news-list">
	    {filteredItems.map((n) => (
	      <li key={n._id || n.link} className="news-card" onClick={() => openModal(n)}>
	        <div className="news-content">
	          {n.image_url ? (
	            <div className="news-image-wrapper">
	              <img src={n.image_url} alt={n.title} className="news-image" />
	            </div>
	          ) : (
	            <div className="news-image-wrapper placeholder">이미지 없음</div>
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
	                    ? n.content.length > 120
	                      ? n.content.slice(0, 120) + "..."
	                      : n.content
	                    : n.description || ""
	                ),
	              }}
	            />

				<div className="news-meta">
				  <div className="left-meta">
				    {n.mediaLogo && <img src={n.mediaLogo} className="media-logo" />}
				    {n.author && <span className="news-author">{n.author}</span>}
				  </div>
				  <div className="right-meta">
				    {n.pubDate && <span className="news-date">{new Date(n.pubDate).toLocaleString()}</span>}
				  </div>
				</div>
	          </div>
	        </div>
	      </li>
	    ))}
	  </ul>


      {/* 페이지네이션 (검색 중일 때는 숨김) */}
      {!isSearching && (
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
      )}

      {/* 📌 모달 */}
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
			    {selectedNews.author && <span className="news-author">{selectedNews.author}</span>}
			  </div>
			  <div className="right-meta">
			    {selectedNews.pubDate && (
			      <span className="news-date">{new Date(selectedNews.pubDate).toLocaleString()}</span>
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
              dangerouslySetInnerHTML={{ __html: selectedNews.content }}
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
