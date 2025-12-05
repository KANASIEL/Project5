import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
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
} from "@mui/material";
import { red, blue } from "@mui/material/colors";
import SearchIcon from "@mui/icons-material/Search";

function KrxList() {
    const [tab, setTab] = useState(0);
    const [kospi, setKospi] = useState([]);
    const [kosdaq, setKosdaq] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); // 검색어 상태 추가

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [kospiRes, kosdaqRes] = await Promise.all([
                    axios.get("/api/krx/kospi/list"),
                    axios.get("/api/krx/kosdaq/list"),
                ]);

                const process = (res) =>
                    Array.isArray(res.data)
                        ? res.data
                        : res.data?.data || res.data?.list || [];

                setKospi(process(kospiRes));
                setKosdaq(process(kosdaqRes));
            } catch (err) {
                setError("데이터를 불러오지 못했습니다. 새로고침(F5)해주세요.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatNumber = (num) => (num != null ? num.toLocaleString() : "-");
    const formatPrice = (price) => (price != null ? price.toLocaleString() + "원" : "-");

    const getChangeColor = (value) => {
        if (!value) return "#555";
        const str = String(value);
        if (str.includes("상승") || str.includes("+")) return red[700];
        if (str.includes("하락") || str.includes("-")) return blue[700];
        return "#555";
    };

    const calculateTradeAmount = (stock) => {
        const price = stock.current_price || 0;
        const volume = stock.volume || 0;
        return Math.round((price * volume) / 100000000); // 억원 단위
    };

    // 검색 필터링 (성능 최적화)
    const filteredData = useMemo(() => {
        const data = tab === 0 ? kospi : kosdaq;
        if (!searchTerm.trim()) return data;

        const term = searchTerm.toLowerCase().trim();
        return data.filter(stock =>
            stock.name?.toLowerCase().includes(term) ||
            stock.code?.includes(term)
        );
    }, [kospi, kosdaq, tab, searchTerm]);

    // 검색어 하이라이트
    const highlightText = (text, highlight) => {
        if (!highlight.trim() || !text) return text;
        const regex = new RegExp(`(${highlight})`, "gi");
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? <mark key={i}>{part}</mark> : part
        );
    };

    const renderTable = (data) => (
        <TableContainer component={Paper} elevation={4} className="KrxList-table-container">
            <Table size="small" stickyHeader className="KrxList-table">
                <TableHead>
                    <TableRow className="KrxList-header-row">
                        <TableCell className="KrxList-header-cell">순위</TableCell>
                        <TableCell className="KrxList-header-cell">종목명</TableCell>
                        <TableCell align="right" className="KrxList-header-cell">현재가</TableCell>
                        <TableCell align="right" className="KrxList-header-cell">전일대비</TableCell>
                        <TableCell align="right" className="KrxList-header-cell">등락률</TableCell>
                        <TableCell align="right" className="KrxList-header-cell">거래량</TableCell>
                        <TableCell align="right" className="KrxList-header-cell">거래대금(억)</TableCell>
                        <TableCell align="right" className="KrxList-header-cell">시가총액(억)</TableCell>
                        <TableCell align="right" className="KrxList-header-cell">외국인<br/>지분율</TableCell>
                        <TableCell align="right" className="KrxList-header-cell">PER</TableCell>
                        <TableCell align="right" className="KrxList-header-cell">ROE</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
                                <Typography variant="h6" color="text.secondary">
                                    {searchTerm ? `"${searchTerm}" 에 대한 검색 결과가 없습니다` : "데이터가 없습니다"}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.slice(0, searchTerm ? data.length : 100).map((stock, idx) => (
                            <TableRow
                                key={stock.code}
                                hover
                                className={`KrxList-row ${stock.rank === 1 ? "KrxList-rank-1" : ""}`}
                            >
                                <TableCell className="KrxList-cell">
                                    <Chip
                                        label={stock.rank || idx + 1}
                                        size="small"
                                        color={stock.rank === 1 ? "warning" : "default"}
                                    />
                                </TableCell>
                                <TableCell className="KrxList-cell KrxList-name-cell">
                                    <div className="KrxList-stock-name">
                                        {highlightText(stock.name || "", searchTerm)}
                                    </div>
                                    <div className="KrxList-stock-code">
                                        {highlightText(stock.code || "", searchTerm)}
                                    </div>
                                </TableCell>
                                <TableCell align="right" className="KrxList-cell KrxList-price-cell">
                                    {formatPrice(stock.current_price)}
                                </TableCell>
                                <TableCell align="right" className="KrxList-cell" sx={{ color: getChangeColor(stock.change), fontWeight: "bold" }}>
                                    {stock.change || "-"}
                                </TableCell>
                                <TableCell align="right" className="KrxList-cell" sx={{ color: getChangeColor(stock.change_rate), fontWeight: "bold" }}>
                                    {stock.change_rate || "-"}
                                </TableCell>
                                <TableCell align="right" className="KrxList-cell">{formatNumber(stock.volume)}</TableCell>
                                <TableCell align="right" className="KrxList-cell">{formatNumber(calculateTradeAmount(stock))}</TableCell>
                                <TableCell align="right" className="KrxList-cell">{formatNumber(stock.market_cap)}</TableCell>
                                <TableCell align="right" className="KrxList-cell">
                                    {stock.foreign_ratio != null ? stock.foreign_ratio.toFixed(2) + "%" : "-"}
                                </TableCell>
                                <TableCell align="right" className="KrxList-cell">
                                    {stock.per != null ? stock.per.toFixed(2) : "-"}
                                </TableCell>
                                <TableCell align="right" className="KrxList-cell">
                                    {stock.roe != null ? stock.roe.toFixed(2) + "%" : "-"}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );

    if (loading) {
        return (
            <Box sx={{ width: "100%", p: 4 }}>
                <LinearProgress />
                <Typography textAlign="center" mt={2}>주식 데이터를 불러오는 중...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box className="KrxList-container" sx={{ p: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
            <Typography variant="h4" className="KrxList-title" textAlign="center" fontWeight="bold" color="#0d47a1" gutterBottom>
                KRX 주식 시세표
            </Typography>

            {/* 검색창 */}
            <Box sx={{ maxWidth: 600, mx: "auto", mb: 3 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="종목명 또는 종목코드 검색 (예: 삼성전자, 005930)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        backgroundColor: "white",
                        borderRadius: 2,
                        "& .MuiOutlinedInput-root": {
                            "&:hover fieldset": { borderColor: "#0d47a1" },
                            "&.Mui-focused fieldset": { borderColor: "#0d47a1" },
                        },
                    }}
                />
                {searchTerm && (
                    <Typography textAlign="center" mt={1} color="text.secondary">
                        검색 결과: <strong>{filteredData.length}</strong>개 종목
                    </Typography>
                )}
            </Box>

            <Tabs
                value={tab}
                onChange={(e, v) => {
                    setTab(v);
                    setSearchTerm(""); // 탭 변경 시 검색어 초기화
                }}
                centered
                className="KrxList-tabs"
                sx={{ mb: 3 }}
            >
                <Tab label={`KOSPI (${kospi.length}종목)`} />
                <Tab label={`KOSDAQ (${kosdaq.length}종목)`} />
            </Tabs>

            <Box className="KrxList-content">
                {renderTable(filteredData)}
            </Box>

            <Box textAlign="center" mt={4} color="#666">
                <Typography variant="body2">
                    데이터 출처: 네이버 증권 크롤링 • 실시간 검색 지원
                </Typography>
            </Box>
        </Box>
    );
}

export default KrxList;