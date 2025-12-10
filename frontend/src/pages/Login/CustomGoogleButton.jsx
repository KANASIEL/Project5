import React from "react";
import "./CustomGoogleButton.css";

const CustomGoogleButton = () => {
  const handleGoogleLogin = () => {
    const googleBtn = document.querySelector("#googleLoginButton div[role='button']");
    if (googleBtn) {
      googleBtn.click();
    } else {
      console.error("Google login button not found.");
    }
  };

  return (
    <button className="custom-google-btn" onClick={handleGoogleLogin}>
      구글로 로그인하기
    </button>
  );
};

export default CustomGoogleButton;
