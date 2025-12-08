import React, { useEffect } from "react";
import axios from "axios";

const KakaoLogin = () => {

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://developers.kakao.com/sdk/js/kakao.js";
    script.onload = () => {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init("bf9f9907f0485f2f46de133469b6c7d1"); // JavaScript Key
        console.log("Kakao SDK Initialized!");
      }
    };
    document.body.appendChild(script);
  }, []);

  const handleKakaoLogin = () => {
    window.Kakao.Auth.login({
      success: function (authObj) {
        console.log("로그인 성공:", authObj);

        window.Kakao.API.request({
          url: "/v2/user/me",
          success: function (res) {
            console.log("카카오 프로필:", res);

            const dto = {
              kakaoId: String(res.id),
              email: res.kakao_account?.email || null,
              nickname: res.properties?.nickname || null,
              profileImage: res.properties?.profile_image || null
            };

            axios.post("http://localhost:8585/api/auth/loginOrRegister", dto)
              .then(result => {
                console.log("서버 응답:", result.data);
                alert("로그인 성공!");
              });
          }
        });
      },
      fail: function (err) {
        console.log("로그인 실패:", err);
      }
    });
  };

  return <button onClick={handleKakaoLogin}>카카오 로그인</button>;
};

export default KakaoLogin;
