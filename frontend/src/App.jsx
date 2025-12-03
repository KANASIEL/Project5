import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import StockSearch from "./pages/test.jsx"
import MainPage from "./pages/Main/MainPage.jsx";


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/stocks" element={<StockSearch/>}/>
                <Route path="/main" element={<MainPage/>}/>
            </Routes>
        </Router>
    );
}

export default App