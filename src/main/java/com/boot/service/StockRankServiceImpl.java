// src/main/java/com/boot/service/StockRankServiceImpl.java
package com.boot.service;

import com.boot.dao.StockKoreaDAO;
import com.boot.dto.StockKoreaDTO;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockRankServiceImpl implements StockRankService {

    private final RedisTemplate<String, String> redisTemplate;
    private final StockKoreaDAO stockKoreaDAO;
    private ZSetOperations<String, String> zSet;

    @PostConstruct
    public void init() {
        this.zSet = redisTemplate.opsForZSet();
        // 서버 시작 시 랭킹 생성
        refreshLatestRank();
    }

    @Override
    @Scheduled(cron = "0 30 16 * * MON-FRI")  // 매일 16:30 자동 갱신
    public void refreshLatestRank() {
        log.info("=== 최신 데이터 기준 랭킹 갱신 시작 ===");

        // 1. DB에서 가장 최신 basDt 찾기
        String latestBasDt = stockKoreaDAO.findFirstByOrderByBasDtDesc()
                .map(StockKoreaDTO::getBasDt)
                .orElse(null);

        if (latestBasDt == null || latestBasDt.isBlank()) {
            log.error("DB에 데이터가 없습니다. 랭킹 생성 불가!");
            return;
        }

        log.info("검색된 최신 기준일: {}", latestBasDt);

        // 2. 해당 날짜의 모든 종목 가져오기
        List<StockKoreaDTO> allStocks = stockKoreaDAO.findByBasDt(latestBasDt);
        if (allStocks.isEmpty()) {
            log.error("basDt={} 에 데이터가 없습니다!", latestBasDt);
            return;
        }

        log.info("총 {}개 종목으로 랭킹 생성 시작", allStocks.size());

        // 3. Redis 키 정의
        String volumeKey = "rank:volume:" + latestBasDt;
        String riseKey   = "rank:rise:" + latestBasDt;
        String fallKey   = "rank:fall:" + latestBasDt;
        String trPrcKey  = "rank:trPrc:" + latestBasDt;

        // 기존 키 삭제
        redisTemplate.delete(List.of(volumeKey, riseKey, fallKey, trPrcKey, "rank:marketcap"));

        // 4. 랭킹 생성
        for (StockKoreaDTO s : allStocks) {
            String id = s.getId();

            // 거래량 (long → double 변환)
            zSet.add(volumeKey, id, (double) s.getTrqu());

            // 상승률 (0보다 크면 추가)
            if (s.getFltRt() > 0.0) {
                zSet.add(riseKey, id, s.getFltRt());
            }

            // 하락률 (0보다 작으면 절댓값으로 추가)
            if (s.getFltRt() < 0.0) {
                zSet.add(fallKey, id, -s.getFltRt());
            }

            // 거래대금
            zSet.add(trPrcKey, id, (double) s.getTrPrc());

            // 시가총액
            zSet.add("rank:marketcap", id, (double) s.getMrktTotAmt());
        }

        log.info("=== 모든 랭킹 생성 완료! 기준일: {} ({}개 종목) ===", latestBasDt, allStocks.size());
    }

    private double getDouble(long value) {
        return (double) value;
    }

    private List<StockKoreaDTO> getRank(String keyPrefix, int limit) {
        String latestBasDt = stockKoreaDAO.findFirstByOrderByBasDtDesc()
                .map(StockKoreaDTO::getBasDt)
                .orElse("1204");

        String key = "rank:marketcap".equals(keyPrefix) ? "rank:marketcap" : keyPrefix + ":" + latestBasDt;

        Set<ZSetOperations.TypedTuple<String>> tuples = zSet.reverseRangeWithScores(key, 0, limit - 1);
        if (tuples == null || tuples.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> ids = tuples.stream()
                .map(ZSetOperations.TypedTuple::getValue)
                .filter(Objects::nonNull)
                .toList();

        if (ids.isEmpty()) return Collections.emptyList();

        List<StockKoreaDTO> stocks = stockKoreaDAO.findByIdIn(ids);
        Map<String, StockKoreaDTO> stockMap = stocks.stream()
                .collect(Collectors.toMap(StockKoreaDTO::getId, v -> v));

        List<StockKoreaDTO> result = new ArrayList<>();
        int rank = 1;
        double prevScore = -1;

        for (ZSetOperations.TypedTuple<String> tuple : tuples) {
            String id = tuple.getValue();
            if (id == null) continue;

            StockKoreaDTO stock = stockMap.get(id);
            if (stock == null) continue;

            Double score = tuple.getScore();
            if (score == null) continue;

            if (prevScore != -1 && Math.abs(prevScore - score) > 0.00001) {
                rank = result.size() + 1;
            }

            stock.setRank(rank++);
            result.add(stock);
            prevScore = score;
        }
        return result;
    }

    @Override public List<StockKoreaDTO> getVolumeTop100()       { return getRank("rank:volume", 100); }
    @Override public List<StockKoreaDTO> getRiseTop100()         { return getRank("rank:rise", 100); }
    @Override public List<StockKoreaDTO> getFallTop100()         { return getRank("rank:fall", 100); }
    @Override public List<StockKoreaDTO> getTradePriceTop100()   { return getRank("rank:trPrc", 100); }
    @Override public List<StockKoreaDTO> getMarketCapTop100()    { return getRank("rank:marketcap", 100); }
}