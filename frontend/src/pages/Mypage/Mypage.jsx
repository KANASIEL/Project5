import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./Mypage.css";

const Mypage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("jwtToken");

                if (!token) {
                    setLoading(false);
                    return;
                }

                // JWT 디코딩하여 userId, loginType 추출
                const decoded = jwtDecode(token);

                console.log("JWT 내용:", decoded);

                // 서버에서 DB 유저 정보 가져오기
                const res = await axios.get("http://localhost:8585/api/info", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                console.log("DB 유저 정보:", res.data);

                // JWT 정보 + DB 정보 병합
                setUser({
                    ...res.data,
                    userId: decoded.sub,          // JWT의 subject
                    loginType: decoded.loginType, // JWT의 loginType
                });

            } catch (err) {
                console.error("사용자 정보 조회 실패:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (loading) return <p>불러오는 중...</p>;
    if (!user) return <p>로그인이 필요합니다.</p>;

    // 🔥 회원 탈퇴 처리
    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm("정말로 회원 탈퇴하시겠습니까?");
        if (!confirmDelete) return;

        try {
            const res = await axios.post(
                "http://localhost:8585/api/deleteUser",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
                    },
                }
            );

            if (res.data === 1) {
                alert("회원 탈퇴 완료");
                localStorage.removeItem("jwtToken");
                window.location.href = "/";
            } else {
                alert("회원 탈퇴 실패");
            }
        } catch (err) {
            console.error(err);
            alert("오류 발생");
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
                    <p><strong>아이디:</strong> {user.userId}</p>
                    <p><strong>닉네임:</strong> {user.nickname}</p>
                    <p><strong>이메일:</strong> {user.email}</p>
                    <p><strong>가입일:</strong> {user.createdAt}</p>
                    <p>
                        <strong>로그인 방식:</strong>{" "}
                        {user.loginType === "KAKAO" ? "카카오 로그인" : "일반 로그인"}
                    </p>
                </div>

                <div>
                    {/* 🔥 LOCAL 로그인일 때만 수정 버튼 표시 */}
                    {user.loginType === "LOCAL" && (
                        <button
                            className="modify_link"
                            onClick={() => navigate("/updateMypage")}
                        >
                            회원정보 수정
                        </button>
                    )}

                    <button className="delete-btn" onClick={handleDeleteAccount}>
                        회원 탈퇴
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Mypage;
