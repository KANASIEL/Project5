// src/pages/Stock/KrxList.jsx - 진짜 완전 최종 끝판왕 (페이지네이션 O + 50개씩 + 너의 CSS 100% 적용)
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    Pagination,
    CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "./KrxList.css";

const ITEMS_PER_PAGE = 50;

function KrxList() {
    const navigate = useNavigate();

    const [tab, setTab] = useState(0); // 0: KOSPI, 1: KOSDAQ
    const [kospi, setKospi] = useState([]);
    const [kosdaq, setKosdaq] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [recentStocks, setRecentStocks] = useState([]);
    const [tradeRanking, setTradeRanking] = useState([]);

    // 한국시간
    const formatKoreanTime = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        if (isNaN(date)) return dateStr;
        return new Date(date.getTime() + 9 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");
    };

    // 데이터 로드
    useEffect(() => {
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
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 최근 본 종목
    useEffect(() => {
        axios.get("/api/krx/recent")
            .then(res => {
                const unique = Array.from(new Map((res.data || []).map(s => [s.code, s])).values()).slice(0, 5);
                setRecentStocks(unique);
            })
            .catch(() => {});
    }, []);

    // 거래대금 랭킹 (30초마다 갱신)
    useEffect(() => {
        const loadRanking = () => {
            axios.get("/api/krx/ranking/trade")
                .then(res => setTradeRanking(res.data || []))
                .catch(() => {});
        };
        loadRanking();
        const id = setInterval(loadRanking, 30000);
        return () => clearInterval(id);
    }, []);

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

    // 실시간 검색 + 탭
    const currentData = tab === 0 ? kospi : kosdaq;

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return currentData;
        const term = searchTerm.trim().toLowerCase();
        return currentData.filter(stock =>
            stock.name?.toLowerCase().includes(term) ||
            stock.code?.includes(term)
        );
    }, [currentData, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const displayData = filteredData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const formatNumber = (n) => n != null ? n.toLocaleString() : "-";
    const formatPrice = (p) => p != null ? p.toLocaleString() + "원" : "-";
    const calculateTradeAmount = (s) => Math.round((s.current_price || 0) * (s.volume || 0) / 1e8);

    if (loading) {
        return (
            <Box className="krx-loading-wrapper">
                <CircularProgress size={60} thickness={4} />
                <Typography className="krx-loading-text">실시간 시세 로딩 중...</Typography>
            </Box>
        );
    }

    return (
        <Box className="krx-page-wrapper">
            {/* 메인 컨텐츠 */}
            <Box className="krx-main-content">
                <Typography className="krx-page-title">KRX 실시간 시세표</Typography>

                {currentData.length > 0 && (
                    <Typography className="krx-crawled-time" style={{ textAlign: "center", color: "#64748b", marginBottom: "1rem" }}>
                        기준 시간: {formatKoreanTime(currentData[0].crawled_at)}
                    </Typography>
                )}

                {/* 검색창 */}
                <Box className="krx-search-wrapper">
                    <TextField
                        fullWidth
                        placeholder="종목명 또는 코드 검색"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        className="krx-search-input"
                    />
                    {searchTerm && (
                        <Typography className="krx-search-result">
                            검색 결과: <strong>{filteredData.length}</strong>개
                        </Typography>
                    )}
                </Box>

                {/* 탭 */}
                <Tabs
                    value={tab}
                    onChange={(_, v) => {
                        setTab(v);
                        setPage(1);
                        setSearchTerm("");
                    }}
                    centered
                    className="krx-tabs"
                    sx={{ marginBottom: "1.5rem" }}
                >
                    <Tab label={`KOSPI (${kospi.length}종목)`} />
                    <Tab label={`KOSDAQ (${kosdaq.length}종목)`} />
                </Tabs>

                {/* 페이지 정보 */}
                <Typography className="krx-page-info">
                    페이지 {page} / {totalPages} • 총 {filteredData.length}종목
                </Typography>

                {/* 테이블 */}
                <TableContainer component={Paper} className="krx-table-container">
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow className="krx-table-head">
                                {["순위", "종목명", "현재가", "전일비", "등락률", "거래량", "거래대금(억)", "시총(억)", "외인", "PER", "ROE"].map(h => (
                                    <TableCell key={h} align="center" className="krx-head-cell">{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {displayData.map((stock, idx) => {
                                const isUp = stock.change_rate?.includes("+");
                                const isDown = stock.change_rate?.includes("-");

                                return (
                                    <TableRow key={stock.code} className="krx-table-row" hover>
                                        <TableCell align="center">
                                            <Chip
                                                label={(page - 1) * 50 + idx + 1}
                                                size="small"
                                                className={(page - 1) * 50 + idx + 1 <= 3 ? "krx-rank-top" : "krx-rank-normal"}
                                            />
                                        </TableCell>
                                        <TableCell onClick={() => goToDetail(stock)} className="krx-name-cell">
                                            <div className="krx-stock-name">{stock.name}</div>
                                            <div className="krx-stock-code">{stock.code}</div>
                                        </TableCell>
                                        <TableCell align="right" className="krx-price-cell">{formatPrice(stock.current_price)}</TableCell>
                                        <TableCell align="center" className={`krx-change-cell ${isUp ? "krx-up" : isDown ? "krx-down" : ""}`}>
                                            {stock.change || "-"}
                                        </TableCell>
                                        <TableCell align="center" className={`krx-change-cell ${isUp ? "krx-up" : isDown ? "krx-down" : ""}`}>
                                            {stock.change_rate || "-"}
                                        </TableCell>
                                        <TableCell align="right" className="krx-number-cell">{formatNumber(stock.volume)}</TableCell>
                                        <TableCell align="right" className="krx-number-cell">{formatNumber(calculateTradeAmount(stock))}</TableCell>
                                        <TableCell align="right" className="krx-number-cell">{formatNumber(stock.market_cap)}</TableCell>
                                        <TableCell align="center" className="krx-number-cell">
                                            {stock.foreign_ratio ? `${stock.foreign_ratio.toFixed(1)}%` : "-"}
                                        </TableCell>
                                        <TableCell align="center" className="krx-number-cell">{stock.per?.toFixed(2) || "-"}</TableCell>
                                        <TableCell align="center" className="krx-number-cell">{stock.roe ? `${stock.roe.toFixed(2)}%` : "-"}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <Box className="krx-pagination-wrapper">
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, v) => {
                                setPage(v);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            color="primary"
                            size="large"
                            showFirstButton
                            showLastButton
                        />
                    </Box>
                )}
            </Box>

            {/* 오른쪽 사이드바 - 거래대금 Top5 */}
            <Paper className="krx-ranking-sidebar">
                <Typography className="krx-ranking-title">거래대금 Top 5</Typography>
                {tradeRanking.slice(0, 5).map((item, i) => (
                    <Box
                        key={item.code}
                        onClick={() => goToDetail({ code: item.code, name: item.name })}
                        className="krx-ranking-item"
                    >
                        <Box className="krx-ranking-item-inner">
                            <Box>
                                <Typography className="krx-ranking-rank">{i + 1}위</Typography>
                                <Typography className="krx-ranking-name">{item.name}</Typography>
                            </Box>
                            <Typography className="krx-ranking-amount">{item.score?.toLocaleString()}억</Typography>
                        </Box>
                    </Box>
                ))}
            </Paper>
        </Box>
    );
}

export default KrxList;