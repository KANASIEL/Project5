// src/main/java/com/boot/service/impl/StockCacheServiceImpl.java
package com.boot.service;

import com.boot.dao.StockKospiRepository;
import com.boot.dao.StockKosdaqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockCacheServiceImpl implements StockCacheService {

    private final StockKospiRepository kospiRepository;
    private final StockKosdaqRepository kosdaqRepository;

    @Override
    @Cacheable(value = "krx_kospi_list")
    public List<Map<String, Object>> getKospiList() {
        return kospiRepository.findAll().stream()
                .map(dto -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("code", dto.getCode());
                    map.put("name", dto.getName());
                    map.put("current_price", dto.getCurrent_price());
                    map.put("change", dto.getChange());
                    map.put("change_rate", dto.getChange_rate());
                    map.put("volume", dto.getVolume());
                    map.put("market_cap", dto.getMarket_cap());
                    map.put("foreign_ratio", dto.getForeign_ratio());
                    map.put("per", dto.getPer());
                    map.put("roe", dto.getRoe());
                    map.put("crawl_date", dto.getCrawl_date());
                    map.put("crawled_at", dto.getCrawled_at());
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "krx_kosdaq_list")
    public List<Map<String, Object>> getKosdaqList() {
        return kosdaqRepository.findAll().stream()
                .map(dto -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("code", dto.getCode());
                    map.put("name", dto.getName());
                    map.put("current_price", dto.getCurrent_price());
                    map.put("change", dto.getChange());
                    map.put("change_rate", dto.getChange_rate());
                    map.put("volume", dto.getVolume());
                    map.put("market_cap", dto.getMarket_cap());
                    map.put("foreign_ratio", dto.getForeign_ratio());
                    map.put("per", dto.getPer());
                    map.put("roe", dto.getRoe());
                    map.put("crawl_date", dto.getCrawl_date());
                    map.put("crawled_at", dto.getCrawled_at());
                    return map;
                })
                .collect(Collectors.toList());
    }
}