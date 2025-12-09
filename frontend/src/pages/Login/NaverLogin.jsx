// NaverLogin.jsx
import React, { useEffect } from "react";

const NaverLogin = () => {
    useEffect(() => {
        const naverScript = document.createElement("script");
        naverScript.src = "https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js";
        naverScript.type = "text/javascript";
        document.head.appendChild(naverScript);

        naverScript.onload = () => {
            const naverLogin = new window.naver.LoginWithNaverId({
                clientId: "WZGOnTNYthFm9SuYQzfY",
                callbackUrl: "http://localhost:5173/login/naver/callback",
                isPopup: false,
                loginButton: { color: "green", type: 3, height: 45 },
            });
            naverLogin.init();
        };
    }, []);

    return <div id="naverIdLogin"></div>;
};

export default NaverLogin;
