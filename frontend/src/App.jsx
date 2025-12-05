import {BrowserRouter as Router, Routes, Route} from "react-router-dom";

import MainPage from "./pages/Main/MainPage.jsx";
import NewsList from "./pages/NewsPage/NewsList.jsx";
import KrxList from "./pages/Stock/KrxList.jsx"

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainPage/>}/>
                <Route path="/krx/list" element={<KrxList/>}/>
                <Route path="/news" element={<NewsList />} />
            </Routes>
        </Router>
    );
}

export default App
