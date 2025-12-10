import React from "react";
import "./CustomNaverButton.css";

const CustomNaverButton = () => {
  const handleClick = () => {
    if (window.naverLogin) {
      window.naverLogin.getLoginStatus(() => {
        // 강제로 네이버 로그인 창 띄우는 핵심 코드
        window.document
          .querySelector("#naverIdLogin a")
          .click();
      });
    }
  };

  return (
    <button onClick={handleClick} className="custom-naver-btn">
      네이버로 로그인하기
    </button>
  );
};

export default CustomNaverButton;
