import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./NewsList.css";

function NewsList({externalKeyword}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const [activeCategory, setActiveCategory] = useState("금융");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [order, setOrder] = useState("desc");

    const pageSize = 5;
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    
    // ✅ MainPage q 파라미터 읽기 (category=금융&q=삼성)
    const initialKeyword = params.get("q") || params.get("keyword") || "";
    const initialCategory = params.get("category") || "금융";

    // ✅ 올바른 Render URL
    const baseUrl = "https://project5-14gp.onrender.com";

    const CATEGORY_LIST = [
        "금융", "증권", "산업/재계", "중기/벤처", 
        "글로벌 경제", "생활경제", "경제 일반"
    ];

    const highlightText = (text) => {
        if (!keyword || !text) return text;
        const pattern = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
        return text.replace(pattern, `<span class="highlight">$1</span>`);
    };

    const fetchNews = async (category, pageNumber = 0, query = keyword, sortOrder = order) => {
        try {
            setLoading(true);
            const searching = query.trim() !== "";
            setIsSearching(searching);

            const url = searching
                ? `${baseUrl}/news/search?category=${encodeURIComponent(category)}&q=${encodeURIComponent(query)}&page=${pageNumber}&size=${pageSize}&order=${sortOrder}`
                : `${baseUrl}/news?category=${encodeURIComponent(category)}&page=${pageNumber}&size=${pageSize}&order=${sortOrder}`;

            console.log("📡 요청 URL:", url);
            console.log("🔍 검색 모드:", searching ? "TF-IDF 랭킹" : "카테고리 목록");

            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            
            // ✅ TF-IDF similarity 점수 콘솔 출력
            if (searching && data.content) {
                console.log("🎯 TF-IDF 랭킹 결과:");
                data.content.forEach((item, idx) => {
                    console.log(`${idx + 1}. ${item.title.slice(0, 30)}... similarity: ${item.similarity?.toFixed(3) || 'N/A'}`);
                });
            }

            setItems(data.content || []);
            setPage(data.number || 0);
            setTotalPages(data.totalPages || 1);
        } catch (e) {
            console.error("❌ 뉴스 가져오기 실패:", e);
            setIsSearching(false);
        } finally {
            setLoading(false);
        }
    };

    // 🔑 URL 파라미터에서 초기값 설정
    useEffect(() => {
        if (initialKeyword) {
            setKeyword(initialKeyword);
            setIsSearching(true);
        }
        if (initialCategory) {
            setActiveCategory(initialCategory);
        }
    }, [initialKeyword, initialCategory]);

    // 🔑 keyword / category / order 변경 시 뉴스 가져오기
    useEffect(() => {
        if (initialKeyword || keyword || activeCategory) {
            fetchNews(activeCategory, 0, keyword, order);
        }
    }, [keyword, activeCategory, order]);

    const handleSearch = () => {
        setPage(0);
        if (keyword.trim() === "") {
            setIsSearching(false);
            fetchNews(activeCategory, 0, "", order);
        } else {
            setIsSearching(true);
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
        fetchNews(activeCategory, pageNumber, keyword, order);
        window.scrollTo({top: 0, behavior: "smooth"});
    };

    const listToShow = isSearching ? items : items;

    return (
        <div className="news-container">
            {/* 🔍 검색 힌트 (MainPage에서 온 경우) */}
            {initialKeyword && (
                <div className="search-hint">
                    💡 "<strong>{initialKeyword}</strong>" 검색 결과 ({items.length}건) 
                    {isSearching && <span>📊 TF-IDF 랭킹 적용됨</span>}
                </div>
            )}

            {/* 검색창 */}
            <div className="search-box">
                <input
                    type="text"
                    placeholder="삼성전자, 신한금융, AI 반도체..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={handleEnter}
                />
                <button className="icon-btn" onClick={handleSearch}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#1e40af" strokeWidth="2"/>
                        <path d="M21 21L16.65 16.65" stroke="#1e40af" strokeWidth="2"/>
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
                            fetchNews(cat, 0, keyword, order);
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

            {/* 리스트 */}
            {loading ? (
                <p className="loading-message">뉴스 로딩중...</p>
            ) : listToShow.length === 0 ? (
                <p className="empty-message">
                    {isSearching
                        ? `❌ "${keyword}" 검색 결과 없음`
                        : "아직 뉴스가 없어요 📰"}
                </p>
            ) : (
                <ul className="news-list">
                    {listToShow.map((n, idx) => (
                        <li key={n._id || n.link || idx} className="news-card" onClick={() => openModal(n)}>
                            <div className="news-content">
                                {n.image_url ? (
                                    <div className="news-image-wrapper">
                                        <img src={n.image_url} alt={n.title} className="news-image"/>
                                    </div>
                                ) : (
                                    <div className="news-image-wrapper placeholder"/>
                                )}

                                <div className="news-text">
                                    <h3 dangerouslySetInnerHTML={{__html: highlightText(n.title || "")}}/>
                                    <p className="news-summary"
                                       dangerouslySetInnerHTML={{
                                           __html: highlightText(
                                               n.content
                                                   ? n.content.length > 150 ? n.content.slice(0, 150) + "..." : n.content
                                                   : n.description || ""
                                           )
                                       }}
                                    />
                                    <div className="news-meta">
                                        <div className="left-meta">
                                            {n.mediaLogo && <img src={n.mediaLogo} className="media-logo" alt="media"/>}
                                            {n.author && <span className="news-author">{n.author}</span>}
                                            {/* ✅ Similarity 점수 표시 */}
                                            {n.similarity && (
                                                <span className="similarity-score">
                                                    📊 {(n.similarity * 100).toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="right-meta">
                                            {n.pubDate && (
                                                <span className="news-date">
                                                    {new Date(n.pubDate).toLocaleString('ko-KR')}
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

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button onClick={() => goToPage(page - 1)} disabled={page === 0}>이전</button>
                    <span>{page + 1} / {totalPages}</span>
                    <button onClick={() => goToPage(page + 1)} disabled={page + 1 === totalPages}>다음</button>
                </div>
            )}

            {/* 모달 */}
            {selectedNews && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 dangerouslySetInnerHTML={{__html: selectedNews.title || ""}}/>
                            <button className="modal-close-btn" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-meta">
                                <div className="left-meta">
                                    {selectedNews.mediaLogo && (
                                        <img src={selectedNews.mediaLogo} className="media-logo" alt="media"/>
                                    )}
                                    {selectedNews.similarity && (
                                        <span className="similarity-score-large">
                                            📊 {(selectedNews.similarity * 100).toFixed(0)}%
                                        </span>
                                    )}
                                    {selectedNews.link && (
                                        <a href={selectedNews.link} target="_blank" rel="noreferrer" className="modal-origin-btn">
                                            기사원문
                                        </a>
                                    )}
                                </div>
                                <div className="right-meta">
                                    {selectedNews.pubDate && (
                                        <span className="news-date">
                                            {new Date(selectedNews.pubDate).toLocaleString('ko-KR')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {selectedNews.image_url && (
                                <div className="modal-image-wrapper">
                                    <img src={selectedNews.image_url} alt={selectedNews.title} className="modal-image"/>
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
                                                    <div className="paragraph-bar"/>
                                                    <div className="article-text" dangerouslySetInnerHTML={{__html: cleanText}}/>
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
