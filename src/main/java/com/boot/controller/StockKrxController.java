package com.boot.controller;

import com.boot.dto.StockKospiDTO;
import com.boot.dto.StockKosdaqDTO;
import com.boot.service.StockKospiService;
import com.boot.service.StockKosdaqService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/krx")
public class StockKrxController {

    private final StockKospiService kospiService;
    private final StockKosdaqService kosdaqService;

    @GetMapping("/kospi/list")
    public List<StockKospiDTO> getKospiStocks() {
        return kospiService.findAll();
    }

    @GetMapping("/kosdaq/list")
    public List<StockKosdaqDTO> getKosdaqStocks() {
        return kosdaqService.findAll();
    }
}
