import React, {useState, useEffect, useMemo, useCallback} from "react";
import axios from "axios";

import {useNavigate, useLocation} from "react-router-dom";
import {useAuth} from "../../context/AuthContext";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, Chip, Tabs, Tab,
    TextField, InputAdornment, Pagination, CircularProgress,
    IconButton, Tooltip
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LightbulbIcon from '@mui/icons-material/Lightbulb'; // AI 제안 아이콘
import "./KrxList.css";

const ITEMS_PER_PAGE = 50;

function KrxList() {
    const FASTAPI_BASE = "http://127.0.0.1:8000";
    const navigate = useNavigate();
    const location = useLocation();
    const {isLoggedIn} = useAuth();

    const params = new URLSearchParams(location.search);
    const initialQuery = params.get("q") || ""; // Main 페이지에서 넘어온 검색어

    const [tab, setTab] = useState(0);
    const [kospi, setKospi] = useState([]);
    const [kosdaq, setKosdaq] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [page, setPage] = useState(1);

    // 🌟 AI 제안 상태
    const [searchSuggestion, setSearchSuggestion] = useState(null);

    const [recentStocks, setRecentStocks] = useState([]);
    const [favoriteStocks, setFavoriteStocks] = useState([]);

    // 🔥 에러 해결: favoriteSet 상태를 useState 훅으로 선언합니다.
    const [favoriteSet, setFavoriteSet] = useState(new Set());

    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = "asc";
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [filters, setFilters] = useState({volumeMin: null, marketCapMin: null});

    // 🟢 랭킹 관련 상수 및 상태 부활
    const rankingTypes = [
        {label: "거래대금", api: "/api/krx/ranking/trade", field: "score"},
        {label: "거래량", api: "/api/krx/ranking/volume", field: "volume"},
        {label: "등락률", api: "/api/krx/ranking/change", field: "changeRate"},
        {label: "시가총액", api: "/api/krx/ranking/market", field: "marketCap"},
        {label: "혼합점수", api: "/api/krx/ranking/mixed", field: "mixedScore"},
    ];

    const [rankingData, setRankingData] = useState([]);
    const [rankingTypeIndex, setRankingTypeIndex] = useState(0);
    const [rankingLoading, setRankingLoading] = useState(false);

    // --- 유틸리티 함수 ---
    // 🚩 [복구] 한국 시간으로 변환하는 함수를 다시 추가합니다.
    const formatKoreanTime = (dateStr) => {
        if (!dateStr) return "-";

        // 1. UTC 문자열을 Date 객체로 파싱 (예: 2025-12-15T00:30:55.620Z)
        const date = new Date(dateStr);

        // 2. Invalid Date 체크
        if (isNaN(date.getTime())) {
            console.error("날짜 파싱 실패:", dateStr);
            return dateStr + " (파싱 오류)";
        }

        // 3. KST 시간대로 포맷하여 반환
        return date.toLocaleString("ko-KR", {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: "Asia/Seoul" // 한국 시간대로 강제 지정
        });
    };

    const formatNumber = (n) => (n != null ? n.toLocaleString() : "-");
    const formatPrice = (p) => (p != null ? p.toLocaleString() + "원" : "-");
    const calculateTradeAmount = (s) => Math.round(((s.current_price || 0) * (s.volume || 0)) / 1e8);
    const isChosungQuery = (text) => /^[ㄱ-ㅎ]+$/.test(text);
    const getChangeClass = (stock) => {
        if (stock.change_rate === '▲') return 'krx-up-limit';
        if (stock.change_rate === '▼') return 'krx-down-limit';
        const changeRate = parseFloat(stock.change_rate?.replace('%', '')) || 0;
        if (changeRate > 0) return 'krx-up';
        if (changeRate < 0) return 'krx-down';
        return 'krx-zero';
    };

    // ---------------- 검색 (FastAPI 연동 및 LLM 제안 처리) ----------------
    const runSearch = async (queryToRun = searchTerm) => {
        const q = queryToRun.trim();
        if (!q) return;

        setIsSearching(true);
        setPage(1);
        setLoading(true);
        setSearchSuggestion(null);

        const useChosungAuto = isChosungQuery(q);

        try {
            const res = await axios.get(`${FASTAPI_BASE}/search`, {
                params: {q, use_chosung: useChosungAuto}
            });

            // 🌟 백엔드 응답에서 suggestion_list 필드를 명시적으로 받습니다.
            const {
                results,
                suggestion_original_query,
                suggestion_message,
                suggestion_list,
                gpt_inferred_word
            } = res.data;

            const mappedResults = (results || []).map(r => ({
                code: r.code,
                name: r.name,
                current_price: r.current_price ?? null,
                change: r.change ?? null,
                change_rate: r.change_rate ?? null,
                volume: r.volume ?? null,
                market_cap: r.market_cap ?? null,
                foreign_ratio: r.foreign_ratio ?? null,
                per: r.per ?? null,
                roe: r.roe ?? null,
                crawled_at: r.crawled_at ?? new Date().toISOString(),
                market: r.market?.toUpperCase()
            }));

            setSearchResults(mappedResults);
            setIsSearching(true);

            // 🌟 제안 상태 저장 (오타 제안 처리)
            if (suggestion_message && suggestion_list && suggestion_list.length > 0) {
                setSearchSuggestion({
                    suggestion_original_query,
                    suggestion_message,
                    suggestion_list,
                    suggestion_inferred_word: gpt_inferred_word
                });
            } else {
                setSearchSuggestion(null);
            }

            // 탭 자동 전환 로직
            if (mappedResults.length > 0) {
                const hasKospi = mappedResults.some(r => r.market === 'KOSPI');
                const hasKosdaq = mappedResults.some(r => r.market === 'KOSDAQ');
                if (hasKospi) setTab(0);
                else if (hasKosdaq) setTab(1);
            }

        } catch (err) {
            console.error("검색 API 호출 실패:", err);
            setSearchResults([]);
            setIsSearching(false);
            setSearchSuggestion(null);
        } finally {
            setLoading(false);
        }
    };

    const cancelSearch = () => {
        setIsSearching(false);
        setSearchResults([]);
        setPage(1);
        setSearchSuggestion(null);
        setSearchTerm(""); // 검색 입력창도 비워줍니다.
        navigate(location.pathname, { replace: true });
    };

    // 🌟 AI 제안 클릭 핸들러: 제안된 쿼리로 재검색 실행
    const handleSuggestionClick = (suggestedQuery) => {
        setSearchTerm(suggestedQuery);
        runSearch(suggestedQuery);
    };

    // ---------------- 데이터 로드 및 기타 함수 ----------------
    const fetchData = async () => {
        try {
            // setLoading(true); // initializeData에서 처리
            const [kospiRes, kosdaqRes] = await Promise.all([
                axios.get(`/api/krx/kospi/list`),
                axios.get(`/api/krx/kosdaq/list`),
            ]);
            setKospi(kospiRes.data || []);
            setKosdaq(kosdaqRes.data || []);
        } catch (err) {
            console.error("KRX 리스트 로드 오류:", err);
        } finally {
            // setLoading(false); // initializeData에서 처리
        }
    };
    const loadRecentStocks = () => {
        axios.get(`/api/krx/recent`).then((res) => {
            const unique = Array.from(new Map((res.data || []).map((s) => [s.code, s])).values()).slice(0, 5);
            setRecentStocks(unique);
        }).catch(() => {
        });
    };
    // 💡 loadFavorites 함수를 useCallback으로 감싸서 안정성 향상
    const loadFavorites = useCallback(async () => {
        if (!isLoggedIn) {
            setFavoriteStocks([]);
            setFavoriteSet(new Set());
            return;
        }
        try {
            const res = await axios.get(`/api/krx/favorites`);
            const favorites = res.data || [];
            setFavoriteStocks(favorites);
            setFavoriteSet(new Set(favorites.map((s) => s.code)));
        } catch (err) {
            console.error("즐겨찾기 로드 실패:", err);
        }
    }, [isLoggedIn]);

    const toggleFavorite = async (stock) => {
        if (!isLoggedIn) return alert("로그인 후 이용 가능합니다!");
        const isFav = favoriteSet.has(stock.code);
        try {
            if (isFav)
                await axios.delete(`/api/krx/favorites/remove`, {data: {code: stock.code}});
            else
                await axios.post(`/api/krx/favorites/add`, {code: stock.code, name: stock.name});
            loadFavorites();
        } catch {
            alert(isFav ? "삭제 실패" : "추가 실패");
        }
    };
    const goToDetail = async (stock) => {
        try {
            await axios.post(`/api/krx/recent/add`, {code: stock.code, name: stock.name});
            setRecentStocks((prev) => {
                const filtered = prev.filter((s) => s.code !== stock.code);
                return [{code: stock.code, name: stock.name}, ...filtered].slice(0, 5);
            });
        } catch (e) {
            console.error("최근 본 종목 저장 실패:", e);
        }
        navigate(`/krx/${stock.code}`);
    };

// 🟢 랭킹 데이터 로드 함수
    const loadRankingData = useCallback(async () => {
        setRankingLoading(true); // 🟢 로딩 시작
        const type = rankingTypes[rankingTypeIndex];

        try {
            const res = await axios.get(`${type.api}`);

            // 🟢 성공했을 경우에만 데이터 덮어쓰기
            if (res.data) {
                setRankingData(res.data);
            } else {
                // 응답은 성공했지만 데이터가 없는 경우 (기존 데이터 유지)
                console.warn(`${type.label} 랭킹 데이터가 비어있습니다. 기존 데이터를 유지합니다.`);
            }
        } catch (err) {
            console.error(`${type.label} 랭킹 로드 실패`, err);
            // 🔴 실패 시에도 기존 데이터(rankingData)는 그대로 유지됩니다.
        } finally {
            setRankingLoading(false); // 🟢 로딩 종료
        }
    }, [rankingTypeIndex]);


    // ----------------------------------------------------
    // 🌟 초기 로드 및 검색 로직: initialQuery가 있을 때 runSearch 자동 실행
    // ----------------------------------------------------
    useEffect(() => {
        const initializeData = async () => {
            setLoading(true);
            try {
                if (initialQuery) {
                    // 1. URL 쿼리가 있으면 검색 실행
                    await runSearch(initialQuery);
                } else {
                    // 2. URL 쿼리가 없으면 일반 데이터 로드 (전체보기 포함)
                    // 검색 결과 모드를 확실히 끕니다.
                    setIsSearching(false);
                    await fetchData();
                    setLoading(false);
                }
            } catch (error) {
                console.error("초기 데이터 로드 중 오류 발생:", error);
                setLoading(false);
            }
        };

        initializeData();
        // 의존성 배열에 initialQuery를 넣어 URL 파라미터가 변경될 때마다 초기화 로직을 타도록 보장합니다.
    }, [initialQuery]);

    useEffect(() => {
        loadRecentStocks();
        loadFavorites(); // useCallback으로 감쌌기 때문에 의존성 추가 필요 없음
        loadRankingData();

        // 🟢 랭킹 자동 전환 인터벌
        const rankingInterval = setInterval(
            () => setRankingTypeIndex((prev) => (prev + 1) % rankingTypes.length),
            5000
        );
        return () => clearInterval(rankingInterval);
    }, [isLoggedIn, loadRankingData, loadFavorites]);

    useEffect(() => {
        loadRankingData();
    }, [rankingTypeIndex, loadRankingData]);

    // ---------------- 핸들러 및 데이터 처리 ----------------

    const currentData = useMemo(() => {
        if (isSearching) {
            const kospiResults = searchResults.filter(s => s.market === "KOSPI");
            const kosdaqResults = searchResults.filter(s => s.market === "KOSDAQ");
            return tab === 0 ? kospiResults : kosdaqResults;
        } else {
            return tab === 0 ? kospi : kosdaq;
        }
    }, [isSearching, searchResults, kospi, kosdaq, tab]);

    const handleToggleFavorites = () => {
        if (!isLoggedIn) return alert("로그인 후 즐겨찾기 필터를 사용할 수 있습니다.");
        setShowFavoritesOnly(prev => !prev);
        setPage(1);
    };

    const handleTabChange = (_, v) => {
        setTab(v);
        setPage(1);
    };
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    const handlePageChange = (_, v) => {
        setPage(v);
        window.scrollTo({top: 0, behavior: "smooth"});
    };
    const handleSort = (field) => {
        if (sortField === field) setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const processedData = useMemo(() =>
            currentData.map((stock) => ({...stock, tradeAmount: calculateTradeAmount(stock)})),
        [currentData]
    );

    const sortedData = useMemo(() => {
        let data = [...processedData];
        // favoriteSet이 useState로 선언되어 이제 .has() 오류가 해결됩니다.
        if (showFavoritesOnly) data = data.filter((s) => favoriteSet.has(s.code));

        if (filters.volumeMin) data = data.filter((s) => (s.volume || 0) >= filters.volumeMin);
        if (filters.marketCapMin) data = data.filter((s) => (s.market_cap || 0) >= filters.marketCapMin);

        if (sortField) {
            data = data.map((item, index) => ({item, index}));
            data.sort((a, b) => {
                let aVal = a.item[sortField] ?? 0;
                let bVal = b.item[sortField] ?? 0;
                if (sortField === "change_rate") {
                    aVal = parseFloat(aVal?.replace('%', "")) || 0;
                    bVal = parseFloat(bVal?.replace('%', "")) || 0;
                }
                if (sortField === "name") return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                if (aVal === bVal) return a.index - b.index;
                return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
            });
            data = data.map((d) => d.item);
        }
        return data;
    }, [processedData, sortField, sortOrder, filters, showFavoritesOnly, favoriteSet]);

    const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
    const displayData = sortedData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    // 🟢 랭킹 값 포맷팅 함수 부활
    const formatRankingValue = (item, field) => {
        const value = item[field];
        if (value == null) return "-";
        if (["score", "mixedScore"].includes(field)) {
            return (Math.floor(Number(value) / 1e8)).toLocaleString() + "억";
        }
        if (["marketCap"].includes(field)) return Math.floor(Number(value)).toLocaleString() + "억";
        if (field === "volume") return Number(value).toLocaleString();
        if (field === "changeRate") return value.toString();
        return Number(value).toLocaleString();
    };

    // ---------------- 렌더링 시작 ----------------

    if (loading)
        return (
            <Box className="krx-loading-wrapper">
                <CircularProgress size={60} thickness={4}/>
                <Typography className="krx-loading-text">실시간 시세 로딩 중...</Typography>
            </Box>
        );

    const kospiCount = isSearching ? searchResults.filter(r => r.market === "KOSPI").length : kospi.length;
    const kosdaqCount = isSearching ? searchResults.filter(r => r.market === "KOSDAQ").length : kosdaq.length;

    return (
        <Box className="krx-page-wrapper">
            <Box className="krx-main-content">
                <Typography className="krx-page-title">KRX 실시간 시세표</Typography>
                {currentData.length > 0 && currentData[0].crawled_at && (
                    <Typography className="krx-crawled-time">
                        {/* 🚩 [복구] formatKoreanTime 함수를 사용하여 한국 시간으로 표시 */}
                        기준 시간: {formatKoreanTime(currentData[0].crawled_at)}
                    </Typography>
                )}

                {/* 검색창 */}
                <Box className="krx-search-wrapper">
                    <TextField
                        fullWidth
                        placeholder="종목명 또는 코드 검색"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") runSearch();
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon style={{cursor: "pointer"}} onClick={() => runSearch()}/>
                                </InputAdornment>
                            ),
                        }}
                        className="krx-search-input"
                    />
                    {isSearching && (
                        <Typography className="krx-search-result">
                            검색 결과: <strong>{searchResults.length}</strong>개
                            &nbsp;|&nbsp;<span style={{cursor: "pointer", color: "blue"}}
                                               onClick={cancelSearch}>전체보기</span>
                        </Typography>
                    )}
                </Box>

                {/* 🌟 LLM AI 제안 메시지 및 리스트 UI 렌더링 🌟 */}
                {isSearching && searchResults.length === 0 && searchSuggestion?.suggestion_message && (
                    <Box
                        className="krx-ai-suggestion-wrapper"
                    >
                        <Box className="krx-ai-suggestion-header">
                            <LightbulbIcon/> {/* 색상은 CSS 클래스에서 정의 */}
                            <Typography variant="body1" className="krx-ai-suggestion-message">
                                {/* 메시지에서 [클릭하여 확인] 부분을 제외하고 표시 */}
                                {searchSuggestion.suggestion_message.split('[클릭하여 확인]')[0]}
                            </Typography>
                        </Box>

                        {/* 2. 추론된 단어가 있다면, 클릭 가능한 Chip을 별도로 추가하여 사용 편의성을 높입니다. */}
                        {searchSuggestion.suggestion_inferred_word && (
                            <Box className="krx-inferred-word-wrapper">
                                <Typography variant="caption" className="krx-inferred-word-label">추론 단어 클릭:</Typography>
                                <Chip
                                    label={searchSuggestion.suggestion_inferred_word}
                                    onClick={() => handleSuggestionClick(searchSuggestion.suggestion_inferred_word)}
                                    // 🟢 클래스 적용
                                    className="krx-inferred-word-chip"
                                    size="small"
                                    color="warning" // MUI color prop은 유지
                                    variant="filled" // MUI variant prop은 유지
                                />
                            </Box>
                        )}

                        {/* 🌟 유사 종목 제안 목록 나열 (Chip 형태) 🌟 */}
                        {searchSuggestion.suggestion_list?.length > 0 && (
                            <Box className="krx-suggestion-list-wrapper">
                                <Typography variant="caption" className="krx-suggestion-list-label">유사 종목
                                    재검색:</Typography>
                                {searchSuggestion.suggestion_list.map((suggestedQuery, index) => (
                                    <Chip
                                        key={index}
                                        label={suggestedQuery}
                                        onClick={() => handleSuggestionClick(suggestedQuery)}
                                        // 🟢 클래스 적용
                                        className="krx-suggestion-chip"
                                        size="small"
                                        color="warning" // MUI color prop은 유지
                                        variant="outlined" // MUI variant prop은 유지
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                )}
                {/* 🌟 LLM AI 제안 메시지 및 리스트 UI 끝 🌟 */}

                {/* 탭 */}
                <Tabs value={tab} onChange={handleTabChange} centered className="krx-tabs">
                    <Tab label={`KOSPI (${kospiCount}종목)`}/>
                    <Tab label={`KOSDAQ (${kosdaqCount}종목)`}/>
                </Tabs>

                {/* 즐겨찾기 필터 UI */}
                <Box style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    padding: '8px 4px',
                    margin: '8px 0',
                    marginLeft: '4px'
                }}>
                    <Chip
                        icon={showFavoritesOnly ? <StarIcon/> : <StarBorderIcon/>}
                        label={`즐겨찾기 ${showFavoritesOnly ? '만 보기 (해제)' : '필터 켜기'}`}
                        onClick={handleToggleFavorites}
                        color={showFavoritesOnly ? "primary" : "default"}
                        variant={showFavoritesOnly ? "filled" : "outlined"}
                        style={{cursor: 'pointer', marginRight: '16px'}} // 간단한 레이아웃 스타일은 style로 유지
                    />
                </Box>

                <Typography className="krx-page-info">
                    페이지 {page} / {totalPages} • 총 {sortedData.length}종목
                </Typography>

                {/* 시세표 */}
                <TableContainer component={Paper} className="krx-table-container">
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow className="krx-table-head">
                                <TableCell align="center">즐겨찾기</TableCell>
                                {["순위", "종목명", "현재가", "전일비", "등락률", "거래량", "거래대금(억)", "시총(억)", "외인", "PER", "ROE"].map((h) => {
                                    const fieldMap = {
                                        "현재가": "current_price",
                                        "거래량": "volume",
                                        "거래대금(억)": "tradeAmount",
                                        "시총(억)": "market_cap",
                                        "외인": "foreign_ratio",
                                        "PER": "per",
                                        "ROE": "roe",
                                        "등락률": "change_rate",
                                        "종목명": "name"
                                    };
                                    const field = fieldMap[h];
                                    return (
                                        <TableCell
                                            key={h}
                                            align="center"
                                            onClick={() => {
                                                if (field) handleSort(field);
                                            }}
                                            style={{cursor: h === "순위" ? "default" : "pointer"}}
                                        >
                                            {h}
                                            {sortField === field ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {displayData.map((stock, idx) => {
                                const isFav = favoriteSet.has(stock.code);
                                const rank = (page - 1) * ITEMS_PER_PAGE + idx + 1;
                                const changeClass = getChangeClass(stock);

                                return (
                                    <TableRow key={stock.code} hover>
                                        <TableCell align="center">
                                            <Tooltip title={isFav ? "즐겨찾기 제거" : "즐겨찾기 추가"}>
                                                <IconButton size="small" onClick={() => toggleFavorite(stock)}>
                                                    {isFav ? <StarIcon className="krx-star-filled"/> :
                                                        <StarBorderIcon className="krx-star-empty"/>}
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="center"><Chip label={rank} size="small"
                                                                        className={rank <= 3 ? "krx-rank-top" : "krx-rank-normal"}/></TableCell>
                                        <TableCell onClick={() => goToDetail(stock)} className="krx-name-cell">
                                            <div className="krx-stock-name">{stock.name}</div>
                                            <div className="krx-stock-code">{stock.code}</div>
                                        </TableCell>
                                        <TableCell align="right">{formatPrice(stock.current_price)}</TableCell>
                                        <TableCell align="center" className={changeClass}>
                                            {stock.change || "-"}
                                        </TableCell>
                                        <TableCell align="center" className={changeClass}>
                                            {stock.change_rate || "-"}
                                        </TableCell>
                                        <TableCell align="center">{formatNumber(stock.volume)}</TableCell>
                                        <TableCell align="center">{formatNumber(stock.tradeAmount)}</TableCell>
                                        <TableCell align="center">{formatNumber(stock.market_cap)}</TableCell>
                                        <TableCell
                                            align="center">{stock.foreign_ratio != null ? stock.foreign_ratio.toFixed(1) + "%" : "-"}</TableCell>
                                        <TableCell align="center">{stock.per?.toFixed(2) || "-"}</TableCell>
                                        <TableCell
                                            align="center">{stock.roe != null ? stock.roe.toFixed(2) + "%" : "-"}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {totalPages > 1 && (
                    <Box className="krx-pagination-wrapper">
                        <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary"
                                    size="large"/>
                    </Box>
                )}
            </Box>

            {/* 통합 사이드바 (랭킹 부활) */}
            <Box className="krx-sidebar-wrapper">

                {/* 🟢 1. 랭킹 사이드바 부활 */}
                <Paper className="krx-ranking-sidebar">
                    <Typography className="krx-ranking-title">{rankingTypes[rankingTypeIndex].label} Top 10</Typography>

                    {rankingLoading && rankingData.length === 0 ? (
                        // 랭킹 데이터가 없고 로딩 중일 때만 표시 (최소한의 스타일로 중앙 정렬)
                        <Box className="krx-ranking-loading-box">
                            <CircularProgress size={24} color="secondary" />
                        </Box>
                    ) : (
                        rankingData.slice(0,10).map((item,i)=>(
                            <Box
                                key={item.code}
                                onClick={()=>goToDetail({code:item.code, name:item.name})}
                                className="krx-ranking-item"
                            >
                                <Box className="krx-ranking-item-inner">
                                    <Box className="krx-ranking-left">
                                        <Typography className="krx-ranking-rank">{i + 1}</Typography>
                                        <Box>
                                            <Typography className="krx-ranking-name">{item.name}</Typography>
                                            <Typography className="krx-ranking-code">{item.code}</Typography>
                                        </Box>
                                    </Box>
                                    <Typography
                                        className="krx-ranking-amount">{formatRankingValue(item, rankingTypes[rankingTypeIndex].field)}</Typography>
                                </Box>
                            </Box>
                        ))
                    )}
                </Paper>

                {/* 2. 최근 본 종목 */}
                <Paper className="krx-sidebar-section">
                    <Typography variant="h6" className="krx-sidebar-title">최근 본 종목</Typography>
                    {recentStocks.length === 0 ? (
                        <Typography variant="body2" color="textSecondary">최근 본 종목이 없습니다.</Typography>
                    ) : (
                        recentStocks.map((stock) => (
                            <Box
                                key={stock.code}
                                onClick={() => goToDetail(stock)}
                                className="krx-recent-item"
                            >
                                <Typography variant="body1" className="krx-recent-name">{stock.name}</Typography>
                                <Typography variant="body2" className="krx-recent-code">{stock.code}</Typography>
                            </Box>
                        ))
                    )}
                </Paper>

                {/* 3. 즐겨찾기 목록 */}
                <Paper className="krx-sidebar-section">
                    <Typography variant="h6" className="krx-sidebar-title">즐겨찾기 목록
                        ({favoriteStocks.length}개)</Typography>
                    {!isLoggedIn ? (
                        <Typography variant="body2" color="error">로그인이 필요합니다. (즐겨찾기 추가/확인)</Typography>
                    ) : favoriteStocks.length === 0 ? (
                        <Typography variant="body2" color="textSecondary">즐겨찾기한 종목이 없습니다. 테이블에서 별표를 눌러 추가해
                            보세요.</Typography>
                    ) : (
                        favoriteStocks.map((stock) => (
                            <Box
                                key={stock.code}
                                className="krx-favorite-list-item"
                            >
                                <Box
                                    onClick={() => goToDetail(stock)}
                                    className="krx-favorite-link"
                                >
                                    <Typography variant="body1" style={{fontWeight: 'medium'}}>{stock.name}</Typography>
                                </Box>
                                <Tooltip title="즐겨찾기 제거">
                                    <IconButton size="small" onClick={() => toggleFavorite(stock)}>
                                        <StarIcon style={{color: 'gold', fontSize: '1rem'}}/>
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        ))
                    )}
                </Paper>

            </Box>
        </Box>
    );
}

export default KrxList;