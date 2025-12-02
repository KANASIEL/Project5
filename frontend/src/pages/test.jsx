import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function StockSearch() {
    const [stocks, setStocks] = useState([]);

    useEffect(() => {
        axios.get('/api/stocks')
            .then(res => setStocks(res.data.stocks || res.data || []))
            .catch(() => setStocks([]));
    }, []);

    return (
        <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
            <h1>주식 리스트</h1>
            <pre style={{ background: '#f4f4f4', padding: 15, borderRadius: 8 }}>
                {JSON.stringify(stocks, null, 2)}
            </pre>
        </div>
    );
}