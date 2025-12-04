import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StockRank.css";

// 공통 포맷터 불러오기
import { formatMoney, formatVolume } from "../../utils/formatter.js";

const TABS = [
    { key: "volume", title: "거래량 상위", api: "/api/stock/korea/rank/volume" },
    { key: "rise", title: "상승률 상위", api: "/api/stock/korea/rank/rise" },
    { key: "fall", title: "하락률 상위", api: "/api/stock/korea/rank/fall" },
    { key: "trPrc", title: "거래대금 상위", api: "/api/stock/korea/rank/trPrc" },
    { key: "marketcap", title: "시가총액 상위", api: "/api/stock/korea/rank/marketcap" },
];

function StockRank() {
    const [activeTab, setActiveTab] = useState(0);
    const [ranks, setRanks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRank = async () => {
            setLoading(true);
            try {
                const res = await axios.get(TABS[activeTab].api, { params: { limit: 50 } });
                setRanks(res.data);
            } catch (err) {
                console.error("랭킹 로드 실패:", err);
                alert("랭킹을 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };
        fetchRank();
    }, [activeTab]);

    return (
        <div className="stockrank-container">
            <h2 className="stockrank-title">실시간 주식 랭킹</h2>

            {/* 탭 */}
            <div className="stockrank-tab-container">
                {TABS.map((tab, idx) => (
                    <button
                        key={idx}
                        className={`stockrank-tab-button ${activeTab === idx ? "active" : ""}`}
                        onClick={() => setActiveTab(idx)}
                    >
                        {tab.title}
                    </button>
                ))}
            </div>

            {/* 로딩 */}
            {loading && <div className="stockrank-loading">로딩 중입니다...</div>}

            {/* 테이블 */}
            {!loading && ranks.length > 0 && (
                <div className="stockrank-table-wrapper">
                    <table className="stockrank-table">
                        <thead>
                        <tr>
                            <th>순위</th>
                            <th>종목명</th>
                            <th>현재가</th>
                            <th>등락률</th>
                            <th>거래량</th>
                            <th>거래대금</th>
                        </tr>
                        </thead>
                        <tbody>
                        {ranks.map((stock) => (
                            <tr key={stock.id} className="stockrank-row">
                                <td className="stockrank-rank-cell">{stock.rank}위</td>
                                <td className="stockrank-name-cell">
                                    <a href={`/stock/detail/${stock.srtnCd}`} className="stockrank-link">
                                        {stock.itmsNm}
                                    </a>
                                    <span className="stockrank-code">{stock.srtnCd}</span>
                                </td>
                                <td className="stockrank-price-cell">{Number(stock.clpr).toLocaleString()}원</td>
                                <td className={`stockrank-rate-cell ${stock.fltRt > 0 ? "up" : stock.fltRt < 0 ? "down" : ""}`}>
                                    {stock.fltRt > 0 ? "+" : ""}{stock.fltRt.toFixed(2)}%
                                </td>
                                <td className="stockrank-volume-cell">{formatVolume(stock.trqu)}</td>
                                <td className="stockrank-money-cell">{formatMoney(stock.trPrc)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default StockRank;
