// components/Header/Header.jsx
import React from "react";
import "./Header.css";

const IS_LOGGED_IN = false;
const USER_NAME = "김투자";

export default function Header() {
    return (
        <header className="stock-header">
            <div className="stock-header__inner">
                {/* 로고 */}
                <a href="/" className="stock-header__logo">
                    <div className="stock-header__logo-icon">S</div>
                    <span className="stock-header__logo-text">StockNews</span>
                </a>

                {/* 네비게이션 */}
                <nav className="stock-header__nav">
                    <a href="/" className="stock-header__nav-item">홈</a>

                    <div className="stock-header__dropdown">
                        <button className="stock-header__dropdown-toggle">
                            주식 <span className="stock-header__dropdown-arrow">▼</span>
                        </button>
                        <div className="stock-header__dropdown-menu">
                            <a href="/krx/list" className="stock-header__dropdown-item">국내주식</a>
                            <a href="#" className="stock-header__dropdown-item">해외주식</a>
                        </div>
                    </div>

                    <a href="/news" className="stock-header__nav-item">뉴스</a>
                    <a href="#" className="stock-header__nav-item">About</a>
                </nav>

                {/* 오른쪽 유저 영역 */}
                <div className="stock-header__user">
                    {IS_LOGGED_IN ? (
                        <div className="stock-header__user-logged">
                            <span className="stock-header__user-name">{USER_NAME}님</span>
                            <a href="/mypage" className="stock-header__user-link">마이페이지</a>
                            <button className="stock-header__logout-btn">로그아웃</button>
                        </div>
                    ) : (
                        <a href="/login" className="stock-header__login-btn">로그인</a>
                    )}
                </div>

                {/* 모바일 햄버거 */}
                <button className="stock-header__mobile-toggle">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
        </header>
    );
}