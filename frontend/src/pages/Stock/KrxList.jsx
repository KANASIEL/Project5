import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // ← 추가!
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
} from "@mui/material";
import { red, blue } from "@mui/material/colors";
import SearchIcon from "@mui/icons-material/Search";

function KrxList() {
    const navigate = useNavigate(); // ← 추가: 페이지 이동용
    const [tab, setTab] = useState(0);
    const [kospi, setKospi] = useState([]);
    const [kosdaq, setKosdaq] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

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

    // 단순 검색
    const filteredData = React.useMemo(() => {
        const data = tab === 0 ? kospi : kosdaq;
        if (!searchTerm.trim()) return data;

        const term = searchTerm.trim().toLowerCase();
        return data.filter(stock =>
            (stock.name || "").toLowerCase().includes(term) ||
            (stock.code || "").includes(term)
        );
    }, [kospi, kosdaq, tab, searchTerm]);

    // 페이징
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const displayData = filteredData.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    const formatNumber = (num) => (num != null ? num.toLocaleString() : "-");
    const formatPrice = (price) => (price != null ? price.toLocaleString() + "원" : "-");

    const getChangeColor = (value) => {
        if (!value) return "#555";
        const str = String(value);
        return str.includes("상승") || str.includes("+")
            ? red[700]
            : str.includes("하락") || str.includes("-")
                ? blue[700]
                : "#555";
    };

    const calculateTradeAmount = (stock) => {
        const price = stock.current_price || 0;
        const volume = stock.volume || 0;
        return Math.round((price * volume) / 100000000);
    };

    const renderTable = (data) => (
        <TableContainer component={Paper} elevation={4}>
            <Table size="small" stickyHeader>
                {/* 헤더 수정: stickyHeader 때문에 배경색 적용 안 됐던 문제 해결! */}
                <TableHead>
                    <TableRow sx={{ backgroundColor: "#0d47a1" }}>
                        {["순위", "종목명", "현재가", "전일비", "등락률", "거래량", "거래대금(억)", "시총(억)", "외인", "PER", "ROE"].map((h) => (
                            <TableCell
                                key={h}
                                sx={{
                                    color: "white",
                                    fontWeight: "bold",
                                    backgroundColor: "#0d47a1", // ← 이거 추가!
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 10,
                                }}
                            >
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
                                <TableCell>
                                    <Chip
                                        label={globalIdx}
                                        size="small"
                                        color={globalIdx <= 3 ? "warning" : "default"}
                                    />
                                </TableCell>
                                {/* 종목명 클릭 → 상세페이지 이동! */}
                                <TableCell
                                    onClick={() => navigate(`/krx/${stock.code}`)}
                                    sx={{
                                        cursor: "pointer",
                                        "&:hover": {
                                            backgroundColor: "#f0f7ff",
                                            textDecoration: "underline",
                                        },
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            variant="body1"
                                            fontWeight="bold"
                                            color="#0d47a1"
                                            sx={{ "&:hover": { textDecoration: "underline" } }}
                                        >
                                            {stock.name || ""}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {stock.code || ""}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                    {formatPrice(stock.current_price)}
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ color: getChangeColor(stock.change), fontWeight: "bold" }}
                                >
                                    {stock.change || "-"}
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ color: getChangeColor(stock.change_rate), fontWeight: "bold" }}
                                >
                                    {stock.change_rate || "-"}
                                </TableCell>
                                <TableCell align="right">{formatNumber(stock.volume)}</TableCell>
                                <TableCell align="right">{formatNumber(calculateTradeAmount(stock))}</TableCell>
                                <TableCell align="right">{formatNumber(stock.market_cap)}</TableCell>
                                <TableCell align="right">
                                    {stock.foreign_ratio != null ? stock.foreign_ratio.toFixed(1) + "%" : "-"}
                                </TableCell>
                                <TableCell align="right">{stock.per != null ? stock.per.toFixed(2) : "-"}</TableCell>
                                <TableCell align="right">{stock.roe != null ? stock.roe.toFixed(2) + "%" : "-"}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );

    if (loading) {
        return (
            <Box sx={{ p: 4 }}>
                <LinearProgress />
                <Typography textAlign="center" mt={2}>데이터 로딩 중...</Typography>
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
        <Box sx={{ p: { xs: 1, sm: 3 }, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <Typography
                variant="h4"
                textAlign="center"
                fontWeight="bold"
                color="#0d47a1"
                mb={4}
            >
                KRX 실시간 시세표
            </Typography>

            {/* 검색창 */}
            <Box sx={{ maxWidth: 600, mx: "auto", mb: 4 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="종목명 또는 코드 검색 (예: 삼성, 005930)"
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
                    sx={{
                        bgcolor: "white",
                        borderRadius: 2,
                        "& .MuiOutlinedInput-root": {
                            "&:hover fieldset": { borderColor: "#0d47a1" },
                            "&.Mui-focused fieldset": { borderColor: "#0d47a1" },
                        },
                    }}
                />
                {searchTerm && (
                    <Typography textAlign="center" mt={1} color="text.secondary">
                        검색 결과: <strong>{totalItems}</strong>개 종목
                    </Typography>
                )}
            </Box>

            <Tabs
                value={tab}
                onChange={(_, v) => {
                    setTab(v);
                    setPage(1);
                    setSearchTerm("");
                }}
                centered
                sx={{ mb: 3 }}
            >
                <Tab label={`KOSPI (${kospi.length}종목)`} />
                <Tab label={`KOSDAQ (${kosdaq.length}종목)`} />
            </Tabs>

            {/* 페이지 정보 */}
            <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    페이지 {page} / {totalPages} • 총 {totalItems}종목 중{" "}
                    {Math.min(page * ITEMS_PER_PAGE, totalItems)}개 표시
                </Typography>
            </Box>

            {renderTable(displayData)}

            {/* 페이징 */}
            {totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
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

            <Box textAlign="center" mt={4} color="#666">
                <Typography variant="body2">
                    종목 클릭 → 상세페이지 이동 • 50개씩 보기 • 전체 종목 지원
                </Typography>
            </Box>
        </Box>
    );
}

export default KrxList;