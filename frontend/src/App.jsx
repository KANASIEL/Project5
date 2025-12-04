import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import StockSearch from "./pages/test.jsx"
import MainPage from "./pages/Main/MainPage.jsx";
import NewsList from "./pages/NewsPage/NewsList.jsx";


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/stocks" element={<StockSearch/>}/>
                <Route path="/main" element={<MainPage/>}/>
                <Route path="/news" element={<NewsList />} />
            </Routes>
        </Router>
    );
}

export default App
