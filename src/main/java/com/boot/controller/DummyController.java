package com.boot.controller;

import com.boot.dto.DummyDTO;
import com.boot.service.DummyService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;

@Controller
public class DummyController {

    private final DummyService dummyService;

    public DummyController(DummyService dummyService) {
        this.dummyService = dummyService;
    }

    // JSP 페이지 연결
    @GetMapping("/stocksPage")
    public String stocksPage() {
        return "stocks"; // src/main/webapp/WEB-INF/views/stocks.jsp
    }

    // JSON 반환: 전체 조회
    @GetMapping("/stocks")
    @ResponseBody
    public List<DummyDTO> getAllStocks() {
        return dummyService.getAllStocks();
    }

    // JSON 반환: Top N 조회
    @GetMapping("/stocks/top/{count}")
    @ResponseBody
    public List<DummyDTO> getTopStocks(@PathVariable int count) {
        return dummyService.getTopStocks(count);
    }
}
