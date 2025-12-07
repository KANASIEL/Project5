// src/pages/Main/MainPage.jsx
import React, { useState } from 'react';
import './MainPage.css';

function MainPage() {
    const [activeTab, setActiveTab] = useState('stock');
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        console.log(`${activeTab === 'stock' ? '주식' : '뉴스'} 검색:`, searchTerm);
    };

    return (
        <div className="main-container">
            <h1 className="main-title">Stock & News Search</h1>

            <div className="glass-card">
                <div className="tabs">
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`tab ${activeTab === 'stock' ? 'tab-active' : ''}`}
                    >
                        주식 검색
                    </button>
                    <button
                        onClick={() => setActiveTab('news')}
                        className={`tab ${activeTab === 'news' ? 'tab-active' : ''}`}
                    >
                        뉴스 검색
                    </button>
                </div>

                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={
                            activeTab === 'stock'
                                ? '삼성전자, 애플, 테슬라, 엔비디아...'
                                : '경제 뉴스, 기업명, 키워드...'
                        }
                        className="search-input"
                        autoFocus
                    />
                    <button type="submit" className="search-btn">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </form>

                {searchTerm && (
                    <p className="search-hint">
                        검색어: <strong>{searchTerm}</strong>
                    </p>
                )}
            </div>

            <p className="bottom-text">
                실시간 주가 정보와 최신 금융 뉴스를 한곳에서
            </p>
        </div>
    );
}

export default MainPage;