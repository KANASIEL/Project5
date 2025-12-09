import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

// 전역 Auth Provider
export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [nickname, setNickname] = useState("");

    // ---------------------------------------------------------
    // 새로고침(브라우저 reload) 시 localStorage에서 토큰 복원
    // ---------------------------------------------------------
    useEffect(() => {
        const storedToken = localStorage.getItem("jwtToken");
        const storedNickname = localStorage.getItem("nickname");

        // 토큰이 있으면 axios 기본 헤더 설정
        if (storedToken) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
            setIsLoggedIn(true);
            setNickname(storedNickname || "");
        }
    }, []);

    // 로그인 성공 후 실행되는 함수
    const loginSuccess = (nicknameValue) => {
        setIsLoggedIn(true);
        setNickname(nicknameValue);
    };

    // 로그아웃 기능
    const logout = () => {
        setIsLoggedIn(false);
        setNickname("");

        // localStorage 제거
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("nickname");

        // axios 헤더 제거
        delete axios.defaults.headers.common["Authorization"];
    };

    return (
        <AuthContext.Provider
            value={{ isLoggedIn, nickname, loginSuccess, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
