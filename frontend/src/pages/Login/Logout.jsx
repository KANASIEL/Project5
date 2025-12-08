import axios from "axios";
import { useNavigate } from "react-router-dom";

function LogoutButton() {
    const navigate = useNavigate();

    const handleLogout = () => {
        axios.post("http://localhost:8585/api/auth/logout", {}, { withCredentials: true })
            .then(res => {
                console.log(res.data);
                alert("로그아웃 되었습니다.");

                // 세션 초기화 후 메인으로 이동
                navigate("/main");
            })
            .catch(err => {
                console.error("로그아웃 오류:", err);
            });
    };

    return (
        <button onClick={handleLogout}>
            로그아웃
        </button>
    );
}

export default LogoutButton;
