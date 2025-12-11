import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './Register.css';

const SignUpForm = () => {
	
	const navigate = useNavigate();
	
    const [userId, setUserId] = useState("");
    const [userPassword, setUserPassword] = useState("");
    const [email, setEmail] = useState("");
    const [nickname, setNickname] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [message, setMessage] = useState("");
	const [emailError, setEmailError] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [userIdError, setUserIdError] = useState("");

    // 비밀번호 유효성 검사 (8자 이상, 숫자, 대소문자, 특수문자 포함)
    const passwordValidation = (password) => {
        const regex = /^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password);
    };

    // 이메일 유효성 검사
    const emailValidation = (email) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    };

    // 폼 제출 처리
	const handleSubmit = async (event) => {
	    event.preventDefault();

	    setEmailError("");
	    setPasswordError("");
	    setUserIdError("");
	    setMessage("");

	    const validationErrors = [];

	    if (userPassword && !passwordValidation(userPassword)) {
	        setPasswordError("비밀번호는 최소 8자 이상, 특수문자를 포함해야 합니다.");
	        validationErrors.push("비밀번호 유효성 검사 실패");
	    }
	    if (email && !emailValidation(email)) {
	        setEmailError("유효한 이메일 주소를 입력해주세요.");
	        validationErrors.push("이메일 유효성 검사 실패");
	    }
	    if (userId.trim() === "") {
	        validationErrors.push("아이디는 필수 입력 사항입니다.");
	    }
	    if (validationErrors.length > 0) return;

	    // ------------------------------------
	    // 🔥 FormData 생성
	    // ------------------------------------
	    const formData = new FormData();

	    // JSON 데이터를 Blob으로 감싸 넣기
	    const userJson = {
	        user_id: userId,
	        user_password: userPassword,
	        email: email,
	        nickname: nickname,
	    };

	    formData.append(
	        "user",
	        new Blob([JSON.stringify(userJson)], { type: "application/json" })
	    );

	    // 파일 추가
	    if (profileImage) {
	        formData.append("profileImage", profileImage);
	    }

	    try {
	        const response = await axios.post("/api/register", formData, {
	            headers: {
	                "Content-Type": "multipart/form-data",
	            },
	        });

	        if (response.data === "이미 사용 중인 아이디입니다.") {
	            setUserIdError(response.data);
	        } else if (response.data === "이미 사용 중인 이메일입니다.") {
	            setEmailError(response.data);
	        } else {
	            alert("회원가입 완료되었습니다.");
	            navigate("/");
	        }

	    } catch (error) {
	        setMessage("회원가입에 실패했습니다.");
	        console.error(error);
	    }
	};


    return (
        <div className="regiter-wrapper">
		
			<div className="site-title-register">
		        <h1>Stock & News Search</h1>
		    </div>
		
			<div className="register-container">
	            <h2 className="register-title">회원가입</h2>
	            <form onSubmit={handleSubmit}>
	                <div>
	                    <p className="register-p">아이디&nbsp;&nbsp;&nbsp;&nbsp;
						{userIdError && <label style={{ color: "#FF0000" }}>{userIdError}</label>}  {/* 아이디 중복 오류 메시지 */}</p>
	                    <input
	                        type="text"
	                        value={userId}
	                        onChange={(e) => setUserId(e.target.value)}
	                        required
							className="register-input"
	                    />
	                </div>
	                <div>
	                    <p className="register-p">비밀번호&nbsp;&nbsp;&nbsp;&nbsp;
						{passwordError && <label style={{ color: "#FF0000" }}>{passwordError}</label>}</p>
	                    <input
	                        type="password"
	                        value={userPassword}
	                        onChange={(e) => setUserPassword(e.target.value)}
	                        required
							className="register-input"
	                    />
	                </div>
	                <div>
	                    <p className="register-p">이메일&nbsp;&nbsp;&nbsp;&nbsp;
						{emailError && <label style={{ color: "#FF0000" }}>{emailError}</label>}</p>
	                    <input
	                        type="email"
	                        value={email}
	                        onChange={(e) => setEmail(e.target.value)}
	                        required
							className="register-input"
	                    />
	                </div>
	                <div>
	                    <p className="register-p">닉네임</p>
	                    <input
	                        type="text"
	                        value={nickname}
	                        onChange={(e) => setNickname(e.target.value)}
							className="register-input"
	                    />
	                </div>
					<div>
					    <p className="register-p">프로필 이미지</p>
					    <div className="custom-file-upload">
					        <input
					            type="file"
					            id="file-input"
					            onChange={(e) => setProfileImage(e.target.files[0])}  // 선택된 파일을 상태에 저장
					            className="register-input-file"
					        />
					        <label htmlFor="file-input" className="custom-file-label">
					            선택
					        </label>
					        <span className="file-name">
					            {profileImage ? profileImage.name : "파일 선택되지 않음"}
					        </span>
					    </div>
					</div>
	                <button type="submit" className="register-btn">회원가입</button>
	                <button type="button" onClick={() => window.location.href = "/login"} className="register-login">로그인</button>
	            </form>
				
				{message && <p>{message}</p>}
			</div>
        </div>
    );
};

export default SignUpForm;
