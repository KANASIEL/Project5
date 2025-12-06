package com.boot.service;

import com.boot.dto.StockKospiDTO;
import com.boot.dto.StockKosdaqDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class SmartStockSearchService {

    private final StockKospiService kospiService;
    private final StockKosdaqService kosdaqService;

    private List<StockWrapper> allStocks;

    @PostConstruct
    public void init() {
        var kospi = kospiService.findAll().stream().map(dto -> new StockWrapper(dto, "KOSPI"));
        var kosdaq = kosdaqService.findAll().stream().map(dto -> new StockWrapper(dto, "KOSDAQ"));
        allStocks = Stream.concat(kospi, kosdaq).toList();
        System.out.println("AI 검색 엔진 준비 완료! 총 " + allStocks.size() + "종목 인덱싱");
    }

    public List<Map<String, Object>> search(String q) {
        if (q == null || q.trim().isEmpty()) {
            return allStocks.stream()
                    .sorted(Comparator.comparingLong(StockWrapper::getVolume).reversed())
                    .limit(100)
                    .map(StockWrapper::toMap)
                    .toList();
        }

        String query = q.trim();
        String norm = query.replaceAll("\\s+", "");
        String initials = toInitials(query);

        // 정확 매칭 우선
        var exact = allStocks.stream()
                .filter(s -> s.name.contains(query) ||
                        s.code.equals(query) ||
                        s.normName.contains(norm) ||
                        s.initials.contains(initials))
                .sorted((a, b) -> {
                    if (a.code.equals(query)) return -1;
                    if (b.code.equals(query)) return 1;
                    return Integer.compare(a.name.length(), b.name.length());
                })
                .limit(100)
                .toList();

        if (!exact.isEmpty()) {
            return exact.stream().map(StockWrapper::toMap).toList();
        }

        // 유사도 검색
        return allStocks.stream()
                .map(s -> Map.entry(s, score(query, norm, initials, s)))
                .filter(e -> e.getValue() > 0.5)
                .sorted(Comparator.comparingDouble(e -> -e.getValue()))
                .limit(50)
                .map(Map.Entry::getKey)
                .map(StockWrapper::toMap)
                .toList();
    }

    private double score(String q, String norm, String init, StockWrapper s) {
        double score = 0;
        if (s.name.toLowerCase().contains(q.toLowerCase())) score += 3;
        if (s.normName.contains(norm)) score += 2.5;
        if (s.initials.contains(init)) score += 2.5;
        if (s.code.contains(q)) score += 5;
        return score;
    }

    private String toInitials(String text) {
        String cho = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
        StringBuilder sb = new StringBuilder();
        for (char c : text.toCharArray()) {
            if (c >= '가' && c <= '힣') {
                int code = c - '가';
                int choIdx = code / (21 * 28);
                sb.append(cho.charAt(choIdx));
            }
        }
        return sb.toString();
    }

    // 내부 래퍼 클래스
    static class StockWrapper {
        final Object dto;
        final String market;
        final String name, code, normName, initials;

        StockWrapper(Object dto, String market) {
            this.dto = dto;
            this.market = market;
            this.name = getName(dto);
            this.code = getCode(dto);
            this.normName = name.replaceAll("\\s+", "");
            this.initials = ""; // 위 toInitials로 계산
        }

        long getVolume() {
            return dto instanceof StockKospiDTO k ? k.getVolume() :
                    dto instanceof StockKosdaqDTO q ? q.getVolume() : 0L;
        }

        Map<String, Object> toMap() {
            if (dto instanceof StockKospiDTO k) {
                return Map.ofEntries(
                        Map.entry("market", market),
                        Map.entry("code", k.getCode()),
                        Map.entry("name", k.getName()),
                        Map.entry("current_price", k.getCurrent_price()),
                        Map.entry("change", k.getChange()),
                        Map.entry("change_rate", k.getChange_rate()),
                        Map.entry("volume", k.getVolume()),
                        Map.entry("market_cap", k.getMarket_cap()),
                        Map.entry("foreign_ratio", k.getForeign_ratio()),
                        Map.entry("per", k.getPer()),
                        Map.entry("roe", k.getRoe())
                );
            } else if (dto instanceof StockKosdaqDTO q) {
                return Map.ofEntries(
                        Map.entry("market", market),
                        Map.entry("code", q.getCode()),
                        Map.entry("name", q.getName()),
                        Map.entry("current_price", q.getCurrent_price()),
                        Map.entry("change", q.getChange()),
                        Map.entry("change_rate", q.getChange_rate()),
                        Map.entry("volume", q.getVolume()),
                        Map.entry("market_cap", q.getMarket_cap()),
                        Map.entry("foreign_ratio", q.getForeign_ratio()),
                        Map.entry("per", q.getPer()),
                        Map.entry("roe", q.getRoe())
                );
            }
            return Map.of();
        }

        private String getName(Object dto) { return dto instanceof StockKospiDTO k ? k.getName() : ((StockKosdaqDTO)dto).getName(); }
        private String getCode(Object dto) { return dto instanceof StockKospiDTO k ? k.getCode() : ((StockKosdaqDTO)dto).getCode(); }
    }
}