<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>종목 조회</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
<h1>종목 조회</h1>

<button id="allBtn">전체 조회</button>
<button id="topBtn">Top 5 조회</button>

<ul id="stockList"></ul>

<script>
    $(document).ready(function() {
        // 전체 조회
        $("#allBtn").click(function() {
            $.getJSON('/stocks', function(data) {
                displayStocks(data);
            });
        });

        // Top 5 조회
        $("#topBtn").click(function() {
            $.getJSON('/stocks/top/5', function(data) {
                displayStocks(data);
            });
        });

        function displayStocks(stocks) {
            $("#stockList").empty();
            $.each(stocks, function(index, stock) {
                $("#stockList").append(
                    "<li>" + stock.종목명 + " - 현재가: " + stock.현재가 + " - 등락률: " + stock.등락률 + "</li>"
                );
            });
        }
    });
</script>
</body>
</html>
