package com.boot.service;

import com.boot.dto.StockDetailNewsDTO;
import java.util.List;


public interface StockDetailService {
    List<StockDetailNewsDTO> getNews(String code);
    String getChartUrl(String code, String type, String period);
}