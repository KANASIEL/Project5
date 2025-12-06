// src/pages/KrxList.jsx
import React, { useState, useEffect } from "react";
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
    LinearProgress,
    Alert,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    Pagination,
    Skeleton,
} from "@mui/material";
import { red, blue } from "@mui/material/colors";
import SearchIcon from "@mui/icons-material/Search";

function KrxList() {
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [kospi, setKospi] = useState([]);
    const [kosdaq, setKosdaq] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [recentStocks, setRecentStocks] = useState([]);
    const [tradeRanking, setTradeRanking] = useState([]);
    const [recentLoading, setRecentLoading] = useState(true);
    const [rankingLoading, setRankingLoading] = useState(true);
    const ITEMS_PER_PAGE = 50;

    // 1. 종목 목록 로드
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
                setError("데이터 로드 실패");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 2. 최근 본 종목 로드
    useEffect(() => {
        const loadRecent = async () => {
            try {
                setRecentLoading(true);
                const res = await axios.get("/api/krx/recent");
                const data = res.data || [];
                const uniqueMap = new Map();
                data.forEach(item => {
                    if (!uniqueMap.has(item.code)) {
                        uniqueMap.set(item.code, item);
                    }
                });
                setRecentStocks(Array.from(uniqueMap.values()).slice(0, 5));
            } catch (err) {
                console.error("최근 본 종목 로드 실패", err);
            } finally {
                setRecentLoading(false);
            }
        };
        loadRecent();
    }, []);

    // 3. 실시간 거래대금 랭킹 Top5
    useEffect(() => {
        const loadRanking = async () => {
            try {
                setRankingLoading(true);
                const res = await axios.get("/api/krx/ranking/trade");
                setTradeRanking(res.data || []);
            } catch (err) {
                console.error("랭킹 로드 실패", err);
            } finally {
                setRankingLoading(false);
            }
        };
        loadRanking();
        const interval = setInterval(loadRanking, 30000);
        return () => clearInterval(interval);
    }, []);

    // 종목 클릭 → 최근 본 저장 + 상세페이지 이동
    const goToDetail = async (stock) => {
        try {
            await axios.post("/api/krx/recent/add", {
                code: stock.code,
                name: stock.name,
            });
            setRecentStocks(prev => {
                const filtered = prev.filter(s => s.code !== stock.code);
                return [{ code: stock.code, name: stock.name }, ...filtered].slice(0, 5);
            });
        } catch (err) {
            console.error("최근 본 저장 실패", err);
        }
        navigate(`/krx/${stock.code}`);
    };

    // 검색 + 페이징
    const filteredData = React.useMemo(() => {
        const data = tab === 0 ? kospi : kosdaq;
        if (!searchTerm.trim()) return data;
        const term = searchTerm.trim().toLowerCase();
        return data.filter(stock =>
            stock.name?.toLowerCase().includes(term) ||
            stock.code?.includes(term)
        );
    }, [kospi, kosdaq, tab, searchTerm]);

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const displayData = filteredData.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    const formatNumber = (num) => (num != null ? num.toLocaleString() : "-");
    const formatPrice = (price) => (price != null ? price.toLocaleString() + "원" : "-");
    const getChangeColor = (value) => value?.includes("+") ? red[700] : value?.includes("-") ? blue[700] : "#555";

    const calculateTradeAmount = (stock) => {
        const price = stock.current_price || 0;
        const volume = stock.volume || 0;
        return Math.round((price * volume) / 100000000);
    };

    const renderTable = (data) => (
        <TableContainer component={Paper} elevation={4}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow sx={{ backgroundColor: "#0d47a1" }}>
                        {["순위", "종목명", "현재가", "전일비", "등락률", "거래량", "거래대금(억)", "시총(억)", "외인", "PER", "ROE"].map(h => (
                            <TableCell key={h} align="center" sx={{ color: "white", fontWeight: "bold", backgroundColor: "#0d47a1", position: "sticky", top: 0, zIndex: 10 }}>
                                {h}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((stock, idx) => {
                        const globalIdx = (page - 1) * ITEMS_PER_PAGE + idx + 1;
                        return (
                            <TableRow key={stock.code} hover>
                                <TableCell align="center" ><Chip label={globalIdx} size="small" color={globalIdx <= 3 ? "warning" : "default"} /></TableCell>
                                <TableCell onClick={() => goToDetail(stock)} sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f0f7ff" } }}>
                                    <Typography fontWeight="bold" color="#0d47a1">{stock.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">{stock.code}</Typography>
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>{formatPrice(stock.current_price)}</TableCell>
                                <TableCell align="center" sx={{ color: getChangeColor(stock.change), fontWeight: "bold" }}>{stock.change || "-"}</TableCell>
                                <TableCell align="center" sx={{ color: getChangeColor(stock.change_rate), fontWeight: "bold" }}>{stock.change_rate || "-"}</TableCell>
                                <TableCell align="center">{formatNumber(stock.volume)}</TableCell>
                                <TableCell align="center">{formatNumber(calculateTradeAmount(stock))}</TableCell>
                                <TableCell align="center">{formatNumber(stock.market_cap)}</TableCell>
                                <TableCell align="center">{stock.foreign_ratio?.toFixed(1)}% {stock.foreign_ratio ? "" : "-"}</TableCell>
                                <TableCell align="center">{stock.per?.toFixed(2) || "-"}</TableCell>
                                <TableCell align="center">{stock.roe?.toFixed(2) + "%" || "-"}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );

    if (loading) return <Box sx={{ p: 4 }}><LinearProgress /><Typography textAlign="center" mt={2}>로딩 중...</Typography></Box>;
    if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;

    return (
        <Box sx={{ position: "relative", minHeight: "100vh", bgcolor: "#f5f5f5" }}>
            {/* 메인 컨텐츠 - 오른쪽 여백 확보 (랭킹 박스 침범 방지) */}
            <Box sx={{ pr: { xs: "170px", sm: "190px" } }}>
                <Box sx={{ p: { xs: 1, sm: 3 } }}>
                    <Typography variant="h4" textAlign="center" fontWeight="bold" color="#0d47a1" mb={4}>
                        KRX 실시간 시세표
                    </Typography>

                    {/* 최근 본 종목 (상단 고정) */}
                    {recentLoading ? (
                        <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}><Skeleton height={60} /></Paper>
                    ) : recentStocks.length > 0 && (
                        <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                최근 본 종목
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {recentStocks.map(stock => (
                                    <Chip
                                        key={stock.code}
                                        label={`${stock.name} (${stock.code})`}
                                        onClick={() => navigate(`/krx/${stock.code}`)}
                                        color="primary"
                                        variant="outlined"
                                        sx={{ cursor: "pointer" }}
                                    />
                                ))}
                            </Box>
                        </Paper>
                    )}

                    {/* 검색창 */}
                    <Box sx={{ maxWidth: 600, mx: "auto", mb: 4 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="종목명 또는 코드 검색 (예: 삼성, 005930)"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                            sx={{ bgcolor: "white", borderRadius: 2 }}
                        />
                        {searchTerm && (
                            <Typography textAlign="center" mt={1} color="text.secondary">
                                검색 결과: <strong>{totalItems}</strong>개
                            </Typography>
                        )}
                    </Box>

                    {/* 탭 */}
                    <Tabs
                        value={tab}
                        onChange={(_, v) => { setTab(v); setPage(1); setSearchTerm(""); }}
                        centered
                        sx={{ mb: 3 }}
                    >
                        <Tab label={`KOSPI (${kospi.length}종목)`} />
                        <Tab label={`KOSDAQ (${kosdaq.length}종목)`} />
                    </Tabs>

                    {/* 페이지 정보 */}
                    <Box sx={{ textAlign: "center", mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            페이지 {page} / {totalPages} • 총 {totalItems}종목 중 {Math.min(page * ITEMS_PER_PAGE, totalItems)}개 표시
                        </Typography>
                    </Box>

                    {renderTable(displayData)}

                    {totalPages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(_, v) => { setPage(v); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                color="primary"
                                size="large"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </Box>
            </Box>

            {/* 오른쪽 플로팅 랭킹 박스 - 초소형 50% 크기 + 침범 방지 */}
            <Paper
                elevation={6}
                sx={{
                    position: "fixed",
                    top: { xs: 70, sm: 90 },
                    right: { xs: 8, sm: 12 },
                    width: { xs: 140, sm: 160 },
                    maxHeight: "65vh",
                    overflow: "auto",
                    zIndex: 1200,
                    borderRadius: 2,
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: "background.paper",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    fontSize: { xs: "0.75rem", sm: "0.8rem" },
                    "&::-webkit-scrollbar": { width: 4 },
                    "&::-webkit-scrollbar-thumb": { backgroundColor: "#aaa", borderRadius: 2 },
                }}
            >
                <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    gutterBottom
                    color="#d32f2f"
                    sx={{ fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
                >
                    거래대금 Top5
                </Typography>

                {rankingLoading ? (
                    <Box>
                        {[...Array(5)].map((_, i) => <Skeleton key={i} height={40} sx={{ mb: 0.5 }} />)}
                    </Box>
                ) : tradeRanking.length > 0 ? (
                    <Box>
                        {tradeRanking.map((item, i) => (
                            <Box
                                key={item.code}
                                onClick={() => goToDetail({ code: item.code, name: item.name })}
                                sx={{
                                    py: 1,
                                    borderBottom: i < 4 ? "1px solid #eee" : "none",
                                    cursor: "pointer",
                                    borderRadius: 1,
                                    transition: "all 0.2s",
                                    "&:hover": { bgcolor: "#ffebee", transform: "translateX(2px)" },
                                }}
                            >
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box>
                                        <Typography fontWeight="bold" sx={{ fontSize: "0.8rem" }}>
                                            {item.rank}위
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontSize: "0.75rem",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "80px"
                                            }}
                                        >
                                            {item.name}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        fontWeight="bold"
                                        color="#d32f2f"
                                        sx={{ fontSize: "0.85rem" }}
                                    >
                                        {item.score?.toLocaleString()}억
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Typography color="text.secondary" fontSize="0.75rem" textAlign="center" py={1}>
                        데이터 없음
                    </Typography>
                )}
            </Paper>

            <Box textAlign="center" mt={6} mb={4} color="#666">
                <Typography variant="body2">
                    최근 본 종목 • 실시간 거래대금 Top5 (우측 고정) • 종목 클릭 → 상세페이지
                </Typography>
            </Box>
        </Box>
    );
}

export default KrxList;