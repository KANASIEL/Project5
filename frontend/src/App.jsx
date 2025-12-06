import {BrowserRouter as Router, Routes, Route} from "react-router-dom";

import MainPage from "./pages/Main/MainPage.jsx";
import NewsList from "./pages/NewsPage/NewsList.jsx";
import KrxList from "./pages/Stock/KrxList.jsx"
import KrxDetail from "./pages/Stock/KrxDetail.jsx"

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainPage/>}/>
                <Route path="/krx/list" element={<KrxList/>}/>
                <Route path="/news" element={<NewsList />} />
                <Route path="/krx/:code" element={<KrxDetail />} />
            </Routes>
        </Router>
    );
}

export default App
