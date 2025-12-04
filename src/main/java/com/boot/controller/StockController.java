package com.boot.controller;

import com.boot.dao.StockKoreaDAO;
import com.boot.dto.StockKoreaDTO;
import com.boot.service.StockRankService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/stock/korea")
public class StockController {

    private final StockKoreaDAO stockKoreaDAO;
    private final StockRankService rankService;
    private final StockRankService stockRankService;

    // 오늘 날짜 문자열 (공통으로 쓰자!)
    private String today() {
        return LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE); // 20251204
    }

    // 1. 리스트 조회 → 하루 전이 아니라 "가장 최신 데이터"를 주자 (실무 필수)
    @GetMapping("/list")
    public List<StockKoreaDTO> getStockList(@RequestParam(defaultValue = "") String searchText) {
        // 가장 최신 basDt 찾기 (컬렉션에 여러 날짜가 있을 때)
        String latestBasDt = stockKoreaDAO.findFirstByOrderByBasDtDesc()
                .map(StockKoreaDTO::getBasDt)
                .orElse(LocalDate.now().minusDays(1)
                        .format(DateTimeFormatter.ofPattern("yyyyMMdd")));

        if (searchText.isBlank()) {
            return stockKoreaDAO.findByBasDt(latestBasDt);
        } else {
            return stockKoreaDAO.findByBasDtAndKeyword(latestBasDt, searchText);
        }
    }

    // 2. 상세 조회 → 그대로 좋아요!

    // 3. 랭킹 API들 → 내가 준 최신 StockRankService 메서드랑 이름 맞추기
    @GetMapping("/rank/volume")
    public List<StockKoreaDTO> rankByVolume(@RequestParam(defaultValue = "50") int limit) {
        return rankService.getVolumeTop100().stream().limit(limit).toList();
    }

    @GetMapping("/rank/rise")
    public List<StockKoreaDTO> rankByRise(@RequestParam(defaultValue = "50") int limit) {
        return rankService.getRiseTop100().stream().limit(limit).toList();
    }

    @GetMapping("/rank/fall")
    public List<StockKoreaDTO> rankByFall(@RequestParam(defaultValue = "50") int limit) {
        return rankService.getFallTop100().stream().limit(limit).toList();
    }

    @GetMapping("/rank/marketcap")
    public List<StockKoreaDTO> rankByMarketCap(@RequestParam(defaultValue = "50") int limit) {
        return rankService.getMarketCapTop100().stream().limit(limit).toList();
    }


    @GetMapping("/rank/trPrc")
    public List<StockKoreaDTO> rankByTradePrice(@RequestParam(defaultValue = "20") int limit) {
        return rankService.getTradePriceTop100()
                .stream()
                .limit(limit)
                .toList();
    }



    // GET 방식 (브라우저에서 바로 테스트 가능)
    @GetMapping("/refresh-rank")
    public ResponseEntity<String> refreshRank() {
        log.info("관리자 수동 랭킹 갱신 요청 받음");
        try {
            stockRankService.refreshLatestRank();  // 여기서 DB → Redis 갱신
            return ResponseEntity.ok("랭킹 갱신 완료! (최신 데이터 기준)");
        } catch (Exception e) {
            log.error("랭킹 갱신 실패", e);
            return ResponseEntity.internalServerError()
                    .body("갱신 실패: " + e.getMessage());
        }
    }
}
