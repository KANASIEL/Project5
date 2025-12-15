import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Box,
    Typography,
    Paper,
    Chip,
    Button,
    LinearProgress,
    Alert,
    Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import "./KrxDetail.css";
import { useTranslation } from "react-i18next";

function StockDetail() {
	const { t } = useTranslation();
	
    const { code } = useParams();
    const navigate = useNavigate();

    const [stock, setStock] = useState(null);
    const [news, setNews] = useState([]);
    const [chartUrl, setChartUrl] = useState("");
    const [chartMode, setChartMode] = useState("area");
    const [chartPeriod, setChartPeriod] = useState("day");
    const [loading, setLoading] = useState(true);
    const [newsLoading, setNewsLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(true);
    const [error, setError] = useState(null);
    const [priceInfo, setPriceInfo] = useState(null);
    const [priceLoading, setPriceLoading] = useState(true);

    useEffect(() => {
        const fetchStock = async () => {
            try {
                setLoading(true);
                const [kospiRes, kosdaqRes] = await Promise.all([
                    axios.get("/api/krx/kospi/list"),
                    axios.get("/api/krx/kosdaq/list"),
                ]);
                const all = [...(kospiRes.data || []), ...(kosdaqRes.data || [])];
                const found = all.find((s) => s.code === code);
                if (found) setStock(found);
                else setError("종목을 찾을 수 없습니다.");
            } catch (err) {
                console.error(err);
                setError("데이터 로드 실패");
            } finally {
                setLoading(false);
            }
        };
        fetchStock();
    }, [code]);


    useEffect(  () => {
        const fetchPriceInfo = async () => {
            try {
                setPriceLoading(true);
                const res = await axios.get(`/api/krx/price/${code}`);
                setPriceInfo(res.data);
            } catch (err) {
                console.error(err);
                setPriceInfo(null);
            } finally {
                setPriceLoading(false);
            }
        };
        if (code) fetchPriceInfo();
    }, [code]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                setNewsLoading(true);
                const res = await axios.get(`/api/krx/news/${code}`);
                setNews(res.data || []);
            } catch (err) {
                console.error(err);
                setNews([]);
            } finally {
                setNewsLoading(false);
            }
        };
        if (code) fetchNews();
    }, [code]);

    useEffect(() => {
        const fetchChart = async () => {
            try {
                setChartLoading(true);
                const res = await axios.get(
                    `/api/krx/chart/${code}?type=${chartMode}&period=${chartPeriod}`
                );
                setChartUrl(res.data.imgUrl);
            } catch (err) {
                console.error(err);
                setChartUrl("");
            } finally {
                setChartLoading(false);
            }
        };
        if (code) fetchChart();
    }, [code, chartMode, chartPeriod]);

    if (loading) {
        return (
            <Box className="stock-detail__container">
                <LinearProgress />
                <Typography className="stock-detail__loading-text">
                    종목 정보 로딩 중...
                </Typography>
            </Box>
        );
    }
    if (error)
        return <Alert severity="error" className="stock-detail__alert">{error}</Alert>;
    if (!stock)
        return <Alert severity="warning" className="stock-detail__alert">종목을 찾을 수 없습니다.</Alert>;

    const linePeriods = [
        { label: "1일", value: "day" },
        { label: "1주일", value: "week" },
        { label: "3개월", value: "month3" },
        { label: "1년", value: "year" },
        { label: "3년", value: "year3" },
        { label: "5년", value: "year5" },
        { label: "10년", value: "year10" },
    ];
    const candlePeriods = [
        { label: "일봉", value: "day" },
        { label: "주봉", value: "week" },
        { label: "월봉", value: "month" },
    ];

    // 거래대금 억 단위 변환 헬퍼
    const formatTradeAmount = (amount) => {
        if (!amount || amount === 0) return "-";
        const billion = Math.round(amount / 100000000) / 10;
        return billion.toLocaleString() + "억 원";
    };

    return (
        <Box className="stock-detail__container">
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                className="stock-detail__back-btn"
            >
                뒤로가기
            </Button>

            {/* 종목 기본 정보 */}
            <Paper className="stock-detail__info">
                <Typography className="stock-detail__name">{stock.name}</Typography>
                <Typography className="stock-detail__code">{stock.code} • {stock.market || "KOSPI"}</Typography>

                <Box className="stock-detail__grid">
                    <Box>
                        <Typography className="stock-detail__label">현재가</Typography>
                        <Typography className="stock-detail__value">{stock.current_price?.toLocaleString() || "-"}원</Typography>
                    </Box>
                    <Box>
                        <Typography className="stock-detail__label">전일비</Typography>
                        <Typography className={`stock-detail__value ${stock.change?.includes("+") ? "red" : "blue"}`}>{stock.change || "-"}</Typography>
                    </Box>
                    <Box>
                        <Typography className="stock-detail__label">등락률</Typography>
                        <Typography className={`stock-detail__value ${stock.change_rate?.includes("+") ? "red" : "blue"}`}>{stock.change_rate || "-"}</Typography>
                    </Box>
                    <Box>
                        <Typography className="stock-detail__label">거래량</Typography>
                        <Typography className="stock-detail__value">{stock.volume?.toLocaleString() || "-"}</Typography>
                    </Box>
                    <Box>
                        <Typography className="stock-detail__label">시가총액</Typography>
                        <Typography className="stock-detail__value">{stock.market_cap ? stock.market_cap.toLocaleString() + "억" : "-"}</Typography>
                    </Box>
                    <Box>
                        <Typography className="stock-detail__label">외국인 비율</Typography>
                        <Typography className="stock-detail__value">{stock.foreign_ratio?.toFixed(1)}%</Typography>
                    </Box>
                </Box>
            </Paper>

            {/* 주요 시세 섹션 - 실시간 데이터 */}
            <Paper className="stock-detail__info" style={{ marginTop: "30px" }}>
                <Typography className="stock-detail__chart-title">주요 시세 (실시간)</Typography>
                {priceLoading ? (
                    <LinearProgress style={{ margin: "20px" }} />
                ) : (
                    <Box className="stock-detail__grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px", padding: "0 20px" }}>
                        <Box>
                            <Typography className="stock-detail__label">전일 종가</Typography>
                            <Typography className="stock-detail__value">
                                {priceInfo?.prevClose ? priceInfo.prevClose.toLocaleString() : "-"}원
                            </Typography>
                        </Box>
                        <Box>
                            <Typography className="stock-detail__label">시가</Typography>
                            <Typography className="stock-detail__value">
                                {priceInfo?.openPrice ? priceInfo.openPrice.toLocaleString() : "-"}원
                            </Typography>
                        </Box>
                        <Box>
                            <Typography className="stock-detail__label">고가</Typography>
                            <Typography className="stock-detail__value" style={{ color: "#d32f2f" }}>
                                {priceInfo?.highPrice ? priceInfo.highPrice.toLocaleString() : "-"}원
                            </Typography>
                        </Box>
                        <Box>
                            <Typography className="stock-detail__label">저가</Typography>
                            <Typography className="stock-detail__value" style={{ color: "#1976d2" }}>
                                {priceInfo?.lowPrice ? priceInfo.lowPrice.toLocaleString() : "-"}원
                            </Typography>
                        </Box>
                        <Box>
                            <Typography className="stock-detail__label">상한가</Typography>
                            <Typography className="stock-detail__value">
                                {priceInfo?.upperLimit ? priceInfo.upperLimit.toLocaleString() : "-"}원
                            </Typography>
                        </Box>
                        <Box>
                            <Typography className="stock-detail__label">하한가</Typography>
                            <Typography className="stock-detail__value">
                                {priceInfo?.lowerLimit ? priceInfo.lowerLimit.toLocaleString() : "-"}원
                            </Typography>
                        </Box>
                        <Box>
                            <Typography className="stock-detail__label">거래대금</Typography>
                            <Typography className="stock-detail__value">
                                {priceInfo?.tradeAmount ? formatTradeAmount(priceInfo.tradeAmount) : "-"}
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* 차트 모드 선택 */}
            <Box className="stock-detail__chart-mode">
                <Button
                    className={chartMode === "area" ? "stock-detail__btn-contained" : "stock-detail__btn-outlined"}
                    onClick={() => { setChartMode("area"); setChartPeriod("day"); }}
                >
                    선차트
                </Button>
                <Button
                    className={chartMode === "candle" ? "stock-detail__btn-contained" : "stock-detail__btn-outlined"}
                    onClick={() => { setChartMode("candle"); setChartPeriod("day"); }}
                >
                    봉차트
                </Button>
            </Box>

            {/* 차트 기간 선택 */}
            <Box className="stock-detail__chart-period">
                {(chartMode === "area" ? linePeriods : candlePeriods).map((p) => (
                    <Button
                        key={p.value}
                        className={chartPeriod === p.value ? "stock-detail__btn-contained" : "stock-detail__btn-outlined"}
                        onClick={() => setChartPeriod(p.value)}
                    >
                        {p.label}
                    </Button>
                ))}
            </Box>

            {/* 차트 이미지 */}
            <Paper className="stock-detail__chart-card">
                <Typography className="stock-detail__chart-title">주가 차트</Typography>
                {chartLoading ? (
                    <Box className="stock-detail__chart-loading">
                        <LinearProgress />
                        <Typography>차트 로딩 중...</Typography>
                    </Box>
                ) : chartUrl ? (
                    <img src={chartUrl} alt="주가 차트" className="stock-detail__chart-image"/>
                ) : (
                    <Typography>차트를 불러올 수 없습니다.</Typography>
                )}
            </Paper>

            {/* 뉴스 */}
            <Paper className="stock-detail__news-card">
                <Typography className="stock-detail__news-title">실시간 뉴스공시</Typography>
                <Divider className="stock-detail__divider"/>
                {newsLoading ? (
                    <Box className="stock-detail__chart-loading">
                        <LinearProgress />
                        <Typography>뉴스 로딩 중...</Typography>
                    </Box>
                ) : news.length === 0 ? (
                    <Typography>뉴스가 없습니다.</Typography>
                ) : (
                    news.map((item, i) => (
                        <Box key={i} className="stock-detail__news-item">
                            <Typography component="div" className="stock-detail__news-link">
                                <a href={item.link} target="_blank" rel="noopener noreferrer">
                                    {item.title}
                                </a>
                                {item.related && <Chip label={item.related} size="small" style={{ marginLeft: "8px" }} />}
                            </Typography>
                            <Typography className="stock-detail__news-date">{item.date}</Typography>
                        </Box>
                    ))
                )}
                <Box className="stock-detail__news-more">
                    <Button variant="outlined" href={`https://finance.naver.com/item/news.naver?code=${code}`} target="_blank">
                        네이버 증권 뉴스 전체보기
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}

export default StockDetail;