import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StockSearch from "./pages/test.jsx";
import MainPage from "./pages/Main/MainPage.jsx";
import KakaoLogin from "./pages/Login/KakaoLogin.jsx";
import Login from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";

function App() {
  return (
      <Router>
        <Routes>
		  <Route path="/stocks" element={<StockSearch />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/kakaoLogin" element={<KakaoLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
  );
}

export default App;
