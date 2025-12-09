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

	const RECENT_KEY = 'stockNews_recentlyViewed';
	const MAX_RECENT_ITEMS = 5;

	// 1. 최근 본 기사 상태: 로컬 스토리지에서 불러오거나 없으면 빈 배열로 시작
	const [recentlyViewed, setRecentlyViewed] = useState(() => {
		try {
			const saved = localStorage.getItem(RECENT_KEY);
			return saved ? JSON.parse(saved) : [];
		} catch (error) {
			console.error("Failed to load recent news from localStorage:", error);
			return [];
		}
	});

	// 2. 상태가 변경될 때마다 로컬 스토리지에 저장
	useEffect(() => {
		try {
			localStorage.setItem(RECENT_KEY, JSON.stringify(recentlyViewed));
		} catch (error) {
			console.error("Failed to save recent news to localStorage:", error);
		}
	}, [recentlyViewed]);

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

	// ⭐ [추가] 최근 본 기사 목록에서 기사를 찾아 모달을 여는 함수
	const openModalFromRecent = (recentNewsItem) => {
		// 1. 현재 로드된 전체 목록 (items)에서 해당 기사를 찾습니다.
		//    _id 또는 link를 기준으로 찾습니다.
		const fullNewsItem = items.find(n =>
			n._id === recentNewsItem._id || n.link === recentNewsItem.link
		);

		if (fullNewsItem) {
			// 2. 전체 기사 객체를 찾았다면 openModal을 호출하여 팝업을 엽니다.
			openModal(fullNewsItem);
		} else {
			// (선택 사항) 해당 기사가 현재 화면에 로드되지 않은 경우 알림
			console.warn("해당 기사는 현재 목록에 없습니다. 목록을 다시 로드해야 합니다.");
			// alert("해당 기사를 다시 로드해야 합니다.");
		}
	};

	const openModal = (news) => {
		setSelectedNews(news);
		addToRecentlyViewed(news); // <--- 새로 추가된 로직
	};
	const closeModal = () => setSelectedNews(null);

	const goToPage = (pageNumber) => {
		if (pageNumber < 0 || pageNumber >= totalPages) return;
		fetchNews(activeCategory, pageNumber, keyword, order);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const groupedItems = items.reduce((acc, news) => {
		const cat = news.category || "기타";
		if (!acc[cat]) acc[cat] = [];
		acc[cat].push(news);
		return acc;
	}, {});

	const listToShow = isSearching ? items : groupedItems[activeCategory] || [];

	// 언론사 목록 (예시 데이터)
	const MEDIA_COMPANIES = [
		{ id: 1, name: "조선일보", logo: "https://via.placeholder.com/30x30/0000FF/FFFFFF?text=CS" },
		{ id: 2, name: "중앙일보", logo: "https://via.placeholder.com/30x30/FF0000/FFFFFF?text=JA" },
		{ id: 3, name: "동아일보", logo: "https://via.placeholder.com/30x30/008000/FFFFFF?text=DA" },
		{ id: 4, name: "경향신문", logo: "https://via.placeholder.com/30x30/FFA500/FFFFFF?text=KH" },
		{ id: 5, name: "한국경제", logo: "https://via.placeholder.com/30x30/000000/FFFFFF?text=HK" },
	];

	// 3. 최근 목록 추가 함수 정의 (newsItem에서 title과 media 추출)
	const addToRecentlyViewed = (newsItem) => {
		const newsData = {
			title: newsItem.title,
			media: newsItem.media,
			_id: newsItem._id,        // MongoDB 고유 ID
			link: newsItem.link       // 기사 원본 링크
		};

		setRecentlyViewed(prevList => {
			// 중복된 항목 제거
			const filteredList = prevList.filter(item => item.title !== newsData.title);

			// 새 항목을 맨 앞에 추가하고 최대 개수로 자르기
			return [newsData, ...filteredList].slice(0, MAX_RECENT_ITEMS);
		});
	};

	return (
		<div className="layout-container">
			{/* 2. 왼쪽 사이드바: 최근 본 기사 */}
			<div className="sidebar-left">
				<div className="sidebar-section">
					<h3 className="sidebar-title">⭐ 최근 본 기사</h3>
					<ul className="recent-list">
						{/* [수정] hard-coded RECENT_NEWS_LIST 대신 recentlyViewed 사용 */}
						{recentlyViewed.length > 0 ? (
							recentlyViewed.map((news, index) => (
								<li
									key={news._id || index}
									className="recent-item"
									// ⭐ [수정] 클릭 이벤트 추가
									onClick={() => openModalFromRecent(news)}
								>
									<span className="recent-media">{news.media}</span>
									<p className="recent-title">{news.title}</p>
								</li>
							))
						) : (
							<li className="recent-item" style={{ cursor: 'default', padding: '8px' }}>
								<p className="recent-title" style={{ color: '#888' }}>아직 본 기사가 없습니다.</p>
							</li>
						)}
					</ul>
				</div>
			</div>

			{/* 중앙: 기존 뉴스 전체 */}
			<div className="news-main">
				<div className="news-container">
					{/* 검색창 */}
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
								<path d="M21 21L16.65 16.65" stroke="#1e40af" strokeWidth="2" />
							</svg>
						</button>
					</div>

					{/* 카테고리 탭 */}
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

					{/* 정렬 */}
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

					{/* 뉴스 리스트 */}
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

					{/* 페이지네이션 */}
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
				</div>
			</div>

			{/* 4. 오른쪽 사이드바: 언론사 카테고리 */}
			<div className="sidebar-right">
				<div className="sidebar-section media-section">
					<h3 className="sidebar-title">📰 언론사</h3>
					<ul className="media-category-list">
						{MEDIA_COMPANIES.map((company) => (
							<li key={company.id} className="media-item">
								{/* 로고는 가상 이미지 URL 사용, 실제 로고 연결 필요 시 URL 교체 */}
								<img src={company.logo} alt={company.name} className="media-logo-sidebar" />
								<span className="media-name">{company.name}</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* =================== 모달 =================== */}
			{selectedNews && (
				<div className="modal-overlay" onClick={closeModal}>
					<div
						className="modal-content"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="modal-header">
							<h2
								className="modal-title"
								dangerouslySetInnerHTML={{ __html: selectedNews.title }}
							/>
							<button className="modal-close-btn" onClick={closeModal}>
								&times;
							</button>
						</div>

						<div className="modal-body">
							<div className="modal-meta">
								<div className="left-meta">
									{selectedNews.mediaLogo && (
										<img
											src={selectedNews.mediaLogo}
											className="media-logo"
											alt="media"
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

							<div className="modal-article">
								{selectedNews.content &&
									selectedNews.content
										.replace(/<br\s*\/?>/gi, "\n")
										.split(/\n\s*\n|<\/p>/)
										.map((paragraph, idx) => {
											const cleanText = paragraph
												.replace(/<\/?p>/gi, "")
												.trim();
											if (!cleanText) return null;

											return (
												<div key={idx} className="article-paragraph">
													<div className="paragraph-bar" />
													<div
														className="article-text"
														dangerouslySetInnerHTML={{
															__html: cleanText,
														}}
													/>
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
