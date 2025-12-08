import { useState, useEffect } from 'react';
import axios from 'axios';
import './MainPage.css';

function MainPage() {
    const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'news'
    const [searchTerm, setSearchTerm] = useState('');
    const [nickname, setNickname] = useState(null); // 세션 닉네임 저장

    // 세션에서 닉네임 가져오기
    useEffect(() => {
        axios
            .get("http://localhost:8585/api/auth/session/user", { withCredentials: true })
            .then((res) => {
                console.log("세션 정보:", res.data);

                // 백엔드에서 nickname 키로 반환하면 이걸 그대로 사용
                if (res.data.nickname) {
                    setNickname(res.data.nickname);
                }
            })
            .catch((err) => {
                console.error("세션 요청 오류:", err);
            });
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        console.log(`${activeTab === 'stock' ? '주식' : '뉴스'} 검색:`, searchTerm);
        // API 호출 자리
    };

    return (
        <div className="main-wrapper">
            <main className="main-container">

                {/* 🔥 로그인한 유저 닉네임 출력 */}
                {nickname && (
                    <div className="main-user-info">
                        환영합니다, <strong>{nickname}</strong>님
                    </div>
                )}

                <h1 className="main-title">Stock & News Search</h1>

                <div className="main-card">
                    {/* 탭 영역 */}
                    <div className="main-tabs">
                        <button
                            type="button"
                            onClick={() => setActiveTab('stock')}
                            className={`main-tab ${activeTab === 'stock' ? 'main-tab--active' : ''}`}
                        >
                            주식 검색
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('news')}
                            className={`main-tab ${activeTab === 'news' ? 'main-tab--active' : ''}`}
                        >
                            뉴스 검색
                        </button>
                    </div>

                    {/* 검색 폼 */}
                    <form onSubmit={handleSearch} className="main-search-form">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={
                                activeTab === 'stock'
                                    ? '삼성전자, 애플, 테슬라, 엔비디아...'
                                    : '경제 뉴스, 기업명, 키워드...'
                            }
                            className="main-search-input"
                            autoFocus
                        />
                        <button type="submit" className="main-search-button">
                            검색
                        </button>
                    </form>

                    {searchTerm && (
                        <p className="main-search-hint">
                            검색어: <strong>{searchTerm}</strong>
                        </p>
                    )}
                </div>

                <p className="main-footer-text">
                    실시간 주가 정보와 최신 금융 뉴스를 한곳에서
                </p>
            </main>
        </div>
    );
}

export default MainPage;
