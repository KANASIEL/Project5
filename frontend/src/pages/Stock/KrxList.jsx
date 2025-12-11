// src/pages/Stock/KrxList.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, Chip, Tabs, Tab,
    TextField, InputAdornment, Pagination, CircularProgress,
    IconButton, Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "./KrxList.css";

const ITEMS_PER_PAGE = 50;

function KrxList() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    const [tab, setTab] = useState(0);
    const [kospi, setKospi] = useState([]);
    const [kosdaq, setKosdaq] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [recentStocks, setRecentStocks] = useState([]);
    const [favoriteStocks, setFavoriteStocks] = useState([]);
    const [favoriteSet, setFavoriteSet] = useState(new Set());

    const [rankingData, setRankingData] = useState([]);
    const [rankingTypeIndex, setRankingTypeIndex] = useState(0);

    const rankingTypes = [
        { label: "거래대금", api: "/api/krx/ranking/trade", field: "score" },
        { label: "거래량", api: "/api/krx/ranking/volume", field: "volume" },
        { label: "등락률", api: "/api/krx/ranking/change", field: "changeRate" },
        { label: "시가총액", api: "/api/krx/ranking/market", field: "marketCap" },
        { label: "혼합점수", api: "/api/krx/ranking/mixed", field: "mixedScore" },
    ];

    const formatKoreanTime = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        const adjustedTime = new Date(date.getTime() - 9 * 60 * 60 * 1000);
        return adjustedTime.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }).slice(0, -3);
    };

    const formatNumber = (n) => n != null ? n.toLocaleString() : "-";
    const formatPrice = (p) => p != null ? p.toLocaleString() + "원" : "-";
    const calculateTradeAmount = (s) => Math.round((s.current_price || 0) * (s.volume || 0) / 1e8);

    // KRX 리스트 조회
    const fetchData = async () => {
        try {
            setLoading(true);
            const [kospiRes, kosdaqRes] = await Promise.all([
                axios.get("/api/krx/kospi/list"),
                axios.get("/api/krx/kosdaq/list"),
            ]);
            setKospi(kospiRes.data || []);
            setKosdaq(kosdaqRes.data || []);
        } catch (err) {
            console.error("KRX 리스트 로드 오류:", err);
        } finally {
            setLoading(false);
        }
    };

    // 최근 본 종목
    const loadRecentStocks = () => {
        axios.get("/api/krx/recent")
            .then(res => {
                const unique = Array.from(new Map((res.data || []).map(s => [s.code, s])).values()).slice(0, 5);
                setRecentStocks(unique);
            })
            .catch(() => {});
    };

    // 즐겨찾기
    const loadFavorites = async () => {
        if (!isLoggedIn) {
            setFavoriteStocks([]);
            setFavoriteSet(new Set());
            return;
        }
        try {
            const res = await axios.get("/api/krx/favorites");
            setFavoriteStocks(res.data);
            setFavoriteSet(new Set(res.data.map(s => s.code)));
        } catch (err) {
            console.error("즐겨찾기 로드 실패:", err);
        }
    };

    const toggleFavorite = async (stock) => {
        if (!isLoggedIn) return alert("로그인 후 이용 가능합니다!");
        const isFav = favoriteSet.has(stock.code);
        try {
            if (isFav) {
                await axios.delete("/api/krx/favorites/remove", { data: { code: stock.code } });
            } else {
                await axios.post("/api/krx/favorites/add", { code: stock.code, name: stock.name });
            }
            loadFavorites();
        } catch (err) {
            alert(isFav ? "삭제 실패" : "추가 실패");
        }
    };

    // 최근 본 종목 저장
    const goToDetail = async (stock) => {
        try {
            await axios.post("/api/krx/recent/add", { code: stock.code, name: stock.name });
            setRecentStocks(prev => {
                const filtered = prev.filter(s => s.code !== stock.code);
                return [{ code: stock.code, name: stock.name }, ...filtered].slice(0, 5);
            });
        } catch (e) {}
        navigate(`/krx/${stock.code}`);
    };

    // 랭킹 로드
    const loadRankingData = useCallback(async () => {
        const type = rankingTypes[rankingTypeIndex];
        try {
            const res = await axios.get(type.api);
            setRankingData(res.data || []);
        } catch (err) {
            console.error(`${type.label} 랭킹 로드 실패`, err);
            setRankingData([]);
        }
    }, [rankingTypeIndex]);

    // 초기 로드
    useEffect(() => { fetchData(); }, []);
    useEffect(() => {
        loadRecentStocks();
        loadFavorites();
        loadRankingData();

        const rankingInterval = setInterval(() => {
            setRankingTypeIndex(prev => (prev + 1) % rankingTypes.length);
        }, 10000);

        return () => clearInterval(rankingInterval);
    }, [loadRankingData, isLoggedIn]);

    useEffect(() => { loadRankingData(); }, [rankingTypeIndex, loadRankingData]);

    const handleTabChange = (_, v) => { setTab(v); setPage(1); setSearchTerm(""); };
    const handleSearchChange = (e) => { setSearchTerm(e.target.value); setPage(1); };
    const handlePageChange = (_, v) => { setPage(v); window.scrollTo({ top: 0, behavior: "smooth" }); };

    const currentData = tab === 0 ? kospi : kosdaq;
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return currentData;
        const term = searchTerm.trim().toLowerCase();
        return currentData.filter(s => s.name?.toLowerCase().includes(term) || s.code?.includes(term));
    }, [currentData, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const displayData = filteredData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    if (loading) {
        return (
            <Box className="krx-loading-wrapper">
                <CircularProgress size={60} thickness={4} />
                <Typography className="krx-loading-text">실시간 시세 로딩 중...</Typography>
            </Box>
        );
    }

    const formatRankingValue = (item, field) => {
        const value = item[field];
        if (value == null) return "-";

        // 억 단위로 변환이 필요한 경우
        if (["score", "mixedScore"].includes(field)) {
            const val = Number(value) / 1e8;
            return val > 0 ? Math.floor(val).toLocaleString() + "억" : val.toLocaleString() + "억";
        }

        if (["marketCap"].includes(field)) {
            const val = Number(value);
            return val > 0 ? Math.floor(val).toLocaleString() + "억" : val.toLocaleString() + "억";
        }

        if (field === "volume") {
            return Number(value).toLocaleString();
        }

        if (field === "changeRate") {
            return value.toString();
        }

        const val = Number(value);
        return val > 0 ? Math.floor(val).toLocaleString() : val.toLocaleString();
    };


    return (
        <Box className="krx-page-wrapper">
            <Box className="krx-main-content">
                <Typography className="krx-page-title">KRX 실시간 시세표</Typography>

                {currentData.length > 0 && (
                    <Typography className="krx-crawled-time">
                        기준 시간: {formatKoreanTime(currentData[0].crawled_at)}
                    </Typography>
                )}

                {/* 즐겨찾기 */}
                {favoriteStocks.length > 0 && (
                    <Box className="krx-favorite-section">
                        <Typography className="krx-section-title">나의 즐겨찾기 ({favoriteStocks.length})</Typography>
                        <Box className="krx-chips-wrapper">
                            {favoriteStocks.map(stock => (
                                <Chip
                                    key={stock.code}
                                    label={`${stock.name} (${stock.code})`}
                                    onClick={() => goToDetail(stock)}
                                    onDelete={() => toggleFavorite(stock)}
                                    deleteIcon={<StarIcon className="krx-star-icon" />}
                                    className="krx-favorite-chip"
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* 최근 본 종목 */}
                {recentStocks.length > 0 && (
                    <Box className="krx-recent-section">
                        <Typography className="krx-section-title">최근 본 종목</Typography>
                        <Box className="krx-chips-wrapper">
                            {recentStocks.map(s => (
                                <Chip key={s.code} label={`${s.name} (${s.code})`} onClick={() => goToDetail(s)} className="krx-recent-chip" />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* 검색 */}
                <Box className="krx-search-wrapper">
                    <TextField
                        fullWidth
                        placeholder="종목명 또는 코드 검색"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                        className="krx-search-input"
                    />
                    {searchTerm && (
                        <Typography className="krx-search-result">
                            검색 결과: <strong>{filteredData.length}</strong>개
                        </Typography>
                    )}
                </Box>

                {/* 탭 */}
                <Tabs value={tab} onChange={handleTabChange} centered className="krx-tabs">
                    <Tab label={`KOSPI (${kospi.length}종목)`} />
                    <Tab label={`KOSDAQ (${kosdaq.length}종목)`} />
                </Tabs>

                <Typography className="krx-page-info">
                    페이지 {page} / {totalPages} • 총 {filteredData.length}종목
                </Typography>

                {/* 시세표 */}
                <TableContainer component={Paper} className="krx-table-container">
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow className="krx-table-head">
                                <TableCell align="center">즐겨찾기</TableCell>
                                {["순위","종목명","현재가","전일비","등락률","거래량","거래대금(억)","시총(억)","외인","PER","ROE"].map(h => (
                                    <TableCell key={h} align="center">{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {displayData.map((stock, idx) => {
                                const isFav = favoriteSet.has(stock.code);
                                const rank = (page - 1) * ITEMS_PER_PAGE + idx + 1;
                                const isUp = stock.change_rate?.includes("+");
                                const isDown = stock.change_rate?.includes("-");

                                return (
                                    <TableRow key={stock.code} hover>
                                        <TableCell align="center">
                                            <Tooltip title={isFav ? "즐겨찾기 제거" : "즐겨찾기 추가"}>
                                                <IconButton size="small" onClick={() => toggleFavorite(stock)}>
                                                    {isFav ? <StarIcon className="krx-star-filled" /> : <StarBorderIcon className="krx-star-empty" />}
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Chip label={rank} size="small" className={rank <= 3 ? "krx-rank-top" : "krx-rank-normal"} />
                                        </TableCell>

                                        <TableCell onClick={() => goToDetail(stock)} className="krx-name-cell">
                                            <div className="krx-stock-name">{stock.name}</div>
                                            <div className="krx-stock-code">{stock.code}</div>
                                        </TableCell>

                                        <TableCell align="right">{formatPrice(stock.current_price)}</TableCell>
                                        <TableCell align="center" className={isUp ? "krx-up" : isDown ? "krx-down" : ""}>{stock.change || "-"}</TableCell>
                                        <TableCell align="center" className={isUp ? "krx-up" : isDown ? "krx-down" : ""}>{stock.change_rate || "-"}</TableCell>
                                        <TableCell align="center">{formatNumber(stock.volume)}</TableCell>
                                        <TableCell align="center">{formatNumber(calculateTradeAmount(stock))}</TableCell>
                                        <TableCell align="center">{formatNumber(stock.market_cap)}</TableCell>
                                        <TableCell align="center">{stock.foreign_ratio != null ? stock.foreign_ratio.toFixed(1)+"%" : "-"}</TableCell>
                                        <TableCell align="center">{stock.per?.toFixed(2) || "-"}</TableCell>
                                        <TableCell align="center">{stock.roe != null ? stock.roe.toFixed(2)+"%" : "-"}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <Box className="krx-pagination-wrapper">
                        <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" size="large" />
                    </Box>
                )}
            </Box>

            {/* 랭킹 사이드바 */}
            <Paper className="krx-ranking-sidebar">
                <Typography className="krx-ranking-title">{rankingTypes[rankingTypeIndex].label} Top 10</Typography>
                {rankingData.slice(0,10).map((item,i) => (
                    <Box key={item.code} onClick={() => goToDetail({ code:item.code, name:item.name })} className="krx-ranking-item">
                        <Box className="krx-ranking-item-inner">
                            <Box className="krx-ranking-left">
                                <Typography className="krx-ranking-rank">{i+1}</Typography>
                                <Box>
                                    <Typography className="krx-ranking-name">{item.name}</Typography>
                                    <Typography className="krx-ranking-code">{item.code}</Typography>
                                </Box>
                            </Box>
                            <Typography className="krx-ranking-amount">
                                {formatRankingValue(item, rankingTypes[rankingTypeIndex].field)}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Paper>
        </Box>
    );
}

export default KrxList;
