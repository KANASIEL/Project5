import React from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Mypage.css";

const Mypage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return <p>로그인이 필요합니다.</p>;

  const handleDeleteAccount = async () => {
    if (!window.confirm("정말로 회원 탈퇴하시겠습니까?")) return;

    try {
      const res = await axios.post(
        "http://localhost:8585/api/deleteUser",
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` } }
      );
	  console.log("백엔드 응답:", res.data);
      if (res.data === 1) {
        alert("회원 탈퇴 완료");
        logout();
        navigate("/");
      } else {
        alert("회원 탈퇴 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류 발생");
    }
  };

  return (
    <div className="mypage-wrap">
      <div className="mypage-container">
        <h2 className="mypage-title">마이페이지</h2>
        <img
          src={
            user.profileImage
              ? user.profileImage.startsWith("http")
                ? user.profileImage
                : `http://localhost:8585/uploads/${encodeURIComponent(user.profileImage)}`
              : "/Default-Profile.png"
          }
          alt="프로필"
          className="user-profileImage"
        />
        <div className="user-info-box">
          {user.loginType === "LOCAL" && <p><strong>아이디:</strong> {user.user_id}</p>}
          <p><strong>닉네임:</strong> {user.nickname}</p>
          <p><strong>이메일:</strong> {user.email}</p>
          <p><strong>가입일:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          <p>
            <strong>로그인 방식:</strong>{" "}
            {user.loginType === "KAKAO"
              ? "카카오 로그인"
              : user.loginType === "NAVER"
              ? "네이버 로그인"
			  : user.loginType === "GOOGLE"
			  ? "구글 로그인"
              : "일반 로그인"}
          </p>
        </div>

        {user.loginType === "LOCAL" && (
          <button className="modify_link" onClick={() => navigate("/updateMypage")}>
            회원정보 수정
          </button>
        )}
        <button className="delete-btn" onClick={handleDeleteAccount}>
          회원 탈퇴
        </button>
      </div>
    </div>
  );
};

export default Mypage;
