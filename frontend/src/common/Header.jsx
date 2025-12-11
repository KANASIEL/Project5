import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logout from "../pages/Login/Logout";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import "./Header.css";

export default function Header() {
    const { isLoggedIn, user, logout } = useAuth();
    const { t } = useTranslation();

	const changeLang = (e) => {
	    const lang = e.target.value;
	    i18n.changeLanguage(lang);
	    localStorage.setItem("i18nextLng", lang); // ⭐ 선택한 언어 저장
	};

    return (
        <header className="stock-header">
            <div className="stock-header__inner">

                {/* 로고 */}
                <Link to="/" className="stock-header__logo">
                    <div className="stock-header__logo-icon">S</div>
                    <span className="stock-header__logo-text">StockNews</span>
                </Link>

                {/* 네비게이션 */}
                <nav className="stock-header__nav">
                    <Link to="/" className="stock-header__nav-item">{t("home")}</Link>
                    <Link to="/krx/list" className="stock-header__nav-item">{t("domesticStock")}</Link>
                    <a href="/news" className="stock-header__nav-item">{t("news")}</a>
                    <Link to="#" className="stock-header__nav-item">{t("about")}</Link>
                </nav>

                {/* 오른쪽 사용자 영역 */}
                <div className="stock-header__user">

                    {/* 언어 선택 */}
                    <select
                        className="stock-header__lang-select"
                        onChange={changeLang}
                        defaultValue={i18n.language}
                        style={{ marginRight: "10px", padding: "4px" }}
                    >
                        <option value="ko">한국어</option>
                        <option value="en">English</option>
                        <option value="ja">日本語</option>
                    </select>

                    {isLoggedIn && user ? (
                        <div className="stock-header__user-logged">
                            <span className="stock-header__user-name">
                                {t("helloUser", { name: user.nickname })}
                            </span>

                            <Link to="/mypage" className="stock-header__user-link">
                                {t("mypage")}
                            </Link>

                            <Logout onLogout={logout} />

                        </div>
                    ) : (
                        <Link to="/login" className="stock-header__login-btn">
                            {t("login")}
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
