// NaverCallback.jsx
import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function NaverCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        console.log("🔍 네이버 콜백 code:", code);
        console.log("🔍 네이버 콜백 state:", state);

        if (code) {
            axios
                .get("http://localhost:8585/auth/naver/callback", {
                    params: { code, state }
                })
                .then((res) => {
                    console.log("✅ 백엔드 응답:", res.data);

                    if (res.data.token) {
                        localStorage.setItem("token", res.data.token);
                        navigate("/");
                    } else {
                        console.error("❌ token이 응답에 없음:", res.data);
                    }
                })
                .catch((err) => {
                    console.error("🚨 네이버 로그인 콜백 오류:", err);
                });
        }
    }, []);

    return <div>로그인 처리중...</div>;
}
