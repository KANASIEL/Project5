import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import StockRankTabs from "./StockRank.jsx";
import "./StockList.css";
import { formatVolume, formatMoney, formatVs } from "../../utils/formatter.js";

function StockList() {
    const [allStocks, setAllStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(25);
    const [activeMainTab, setActiveMainTab] = useState("list");

    const fetchStocks = async (keyword = "") => {
        setLoading(true);
        try {
            const res = await axios.get("/api/stock/korea/list", {
                params: keyword ? { searchText: keyword } : {},
            });
            setAllStocks(res.data || []);
            setPage(0);
        } catch (err) {
            alert("데이터를 불러오지 못했습니다.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStocks();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchStocks(searchText), 500);
        return () => clearTimeout(timer);
    }, [searchText]);

    const { currentStocks, totalPages } = useMemo(() => {
        const start = page * size;
        return {
            currentStocks: allStocks.slice(start, start + size),
            totalPages: Math.max(1, Math.ceil(allStocks.length / size)),
        };
    }, [allStocks, page, size]);

    const basDt = allStocks[0]?.basDt;
    const formattedDate = basDt
        ? `${basDt.slice(0, 4)}년 ${basDt.slice(4, 6)}월 ${basDt.slice(6, 8)}일`
        : "";

    return (
        <div className="stocklist-container">
            {/* 📌 상단 탭 */}
            <div className="stocklist-main-tabs">
                {["list", "rank"].map((tab) => (
                    <button
                        key={tab}
                        className={`stocklist-main-tab ${activeMainTab === tab ? "active" : ""}`}
                        onClick={() => setActiveMainTab(tab)}
                    >
                        {tab === "list" ? "주식 시세" : "주식 순위"}
                    </button>
                ))}
            </div>

            {activeMainTab === "list" ? (
                <>
                    <h1 className="stocklist-title">
                        국내 주식 시세
                        {formattedDate && <span className="stocklist-date">({formattedDate} 기준)</span>}
                    </h1>

                    <div className="stocklist-controls">
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="종목명 또는 코드 검색"
                            className="stocklist-search-input"
                        />
                        <select
                            value={size}
                            onChange={(e) => {
                                setSize(Number(e.target.value));
                                setPage(0);
                            }}
                            className="stocklist-size-select"
                        >
                            {[10, 25, 50, 100].map((n) => (
                                <option key={n} value={n}>{n}개씩</option>
                            ))}
                        </select>
                        <div className="stocklist-flex-spacer" />
                        <strong className="stocklist-total-count">총 {allStocks.length.toLocaleString()} 종목</strong>
                    </div>

                    {loading ? (
                        <div className="stocklist-loading">로딩 중입니다...</div>
                    ) : (
                        <>
                            <div className="stocklist-table-wrapper">
                                <table className="stocklist-table">
                                    <thead>
                                    <tr>
                                        <th>종목코드</th><th>종목명</th><th>시장</th><th>종가</th>
                                        <th>전일비</th><th>등락률</th><th>거래량</th>
                                        <th>거래대금</th><th>시가총액</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {currentStocks.map((stock) => (
                                        <tr key={stock.id} className={`stocklist-row ${stock.srtnCd === "005930" ? "samsung" : ""}`}>
                                            <td>{stock.srtnCd}</td>
                                            <td className="stocklist-name-cell">
                                                <a href={`/stock/detail/${stock.srtnCd}`} className="stocklist-link">
                                                    {stock.itmsNm}
                                                </a>
                                            </td>
                                            <td>{stock.mrktCtg}</td>
                                            <td>{Number(stock.clpr).toLocaleString()}원</td>
                                            <td className={`stocklist-vs ${stock.vs > 0 ? "up" : stock.vs < 0 ? "down" : ""}`}>
                                                {formatVs(stock.vs)}
                                            </td>
                                            <td className={`stocklist-rate ${stock.fltRt > 0 ? "up" : stock.fltRt < 0 ? "down" : ""}`}>
                                                {stock.fltRt > 0 ? "+" : ""}{stock.fltRt.toFixed(2)}%
                                            </td>
                                            <td>{formatVolume(stock.trqu)}</td>
                                            <td>{formatMoney(stock.trPrc)}</td>
                                            <td>{formatMoney(stock.mrktTotAmt)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="stocklist-pagination">
                                {["처음", "이전", "다음", "마지막"].map((label, i) => {
                                    const newPage = i === 0 ? 0 : i === 1 ? page - 1 : i === 2 ? page + 1 : totalPages - 1;
                                    const disabled = (i < 2 && page === 0) || (i > 1 && page >= totalPages - 1);
                                    return (
                                        <button key={label} onClick={() => setPage(newPage)} disabled={disabled} className="stocklist-page-btn">
                                            {label}
                                        </button>
                                    );
                                })}
                                <span className="stocklist-page-info">{page + 1} / {totalPages}</span>
                            </div>
                        </>
                    )}
                </>
            ) : (
                <div className="stocklist-rank-full"><StockRankTabs /></div>
            )}
        </div>
    );
}

export default StockList;
