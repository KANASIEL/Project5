import {BrowserRouter as Router, Routes, Route} from "react-router-dom";

import MainPage from "./pages/Main/MainPage.jsx";
import NewsList from "./pages/NewsPage/NewsList.jsx";
import StockList from "./pages/Stock/StockList.jsx"

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainPage/>}/>
                <Route path="/stocks/list" element={<StockList/>}/>
                <Route path="/news" element={<NewsList />} />
            </Routes>
        </Router>
    );
}

export default App
