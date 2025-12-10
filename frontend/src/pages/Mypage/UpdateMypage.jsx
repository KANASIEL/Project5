import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./UpdateMypage.css";

const ModifyUserInfo = () => {
  const { user, loginSuccess } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const passwordValidation = (pw) => /^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pw);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setNickname(user.nickname);
      if (user.profileImage) {
        setPreview(
          `http://localhost:8585/uploads/${encodeURIComponent(user.profileImage)}`
        );
      }
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    if (password && !passwordValidation(password)) {
      setErrorMsg("비밀번호는 8자 이상이고 특수문자를 포함해야 합니다.");
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const formData = new FormData();
    formData.append("user_id", user.user_id);
    formData.append("email", email);
    formData.append("nickname", nickname);
    if (password) formData.append("user_password", password);
    if (profileImage) formData.append("profileImage", profileImage);

    try {
      const res = await axios.post("http://localhost:8585/api/modifyUser", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

	  if (res.data.token) {
	    await loginSuccess(res.data.token);
	  }

      if (res.data.result === 1) {
        alert("회원 정보가 수정되었습니다!");
        navigate("/mypage");
      } else {
        alert("수정 실패");
      }
    } catch (err) {
      console.error("회원 정보 수정 에러", err);
      alert("서버 오류!");
    }
  };

  if (!user) return <p>로그인이 필요합니다.</p>;

  return (
    <div className="modify-container">
      <div className="modify-card">
        <h2 className="modify-title">회원정보 수정</h2>
        <div className="profile-area">
          <img src={preview || "/Default-Profile.png"} alt="프로필 미리보기" className="profile-preview" />
          <label className="upload-btn">
            사진 변경
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
          </label>
        </div>

        {user.loginType === "LOCAL" && (
          <div className="modify-item">
            <label>아이디</label>
            <p className="readonly-box">{user.user_id}</p>
          </div>
        )}

        <div className="modify-item">
          <label>이메일</label>
          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="modify-item">
          <label>닉네임</label>
          <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </div>

        <div className="modify-item">
          <label>비밀번호 변경 (선택)</label>
          <input type="password" placeholder="새 비밀번호 입력" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {errorMsg && <p className="error-msg">{errorMsg}</p>}
        <button className="modify-btn" onClick={handleSubmit}>저장하기</button>
      </div>
    </div>
  );
};

export default ModifyUserInfo;
