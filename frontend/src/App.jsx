import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import "./App.css";
import StockSearch from "./pages/test.jsx"


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/stocks" element={<StockSearch/>}/>
            </Routes>
        </Router>
    );
}

export default App