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
        // 서버 시작 즉시 최신 랭킹 생성 (배포 후에도 바로 보임!)
        refreshLatestRank();
    }

    // 오전 9시 1분 (월~금)
    @Scheduled(cron = "0 1 9 * * MON-FRI", zone = "Asia/Seoul")
    public void scheduledRefreshMorning() {
        refreshLatestRank();
    }

    // 오후 4시 30분 (월~금)
    @Scheduled(cron = "0 30 16 * * MON-FRI", zone = "Asia/Seoul")
    public void scheduledRefreshAfternoon() {
        refreshLatestRank();
    }


    // 수동 갱신용 (API나 관리자 페이지에서 호출 가능)
    @Override
    public void refreshLatestRank() {
        log.info("랭킹 갱신 시작 (수동 또는 스케줄)");

        String latestBasDt = stockKoreaDAO.findFirstByOrderByBasDtDesc()
                .map(StockKoreaDTO::getBasDt)
                .orElse(null);

        if (latestBasDt == null || latestBasDt.isBlank()) {
            log.error("DB에 데이터가 없습니다!");
            return;
        }

        List<StockKoreaDTO> allStocks = stockKoreaDAO.findByBasDt(latestBasDt);
        if (allStocks.isEmpty()) {
            log.error("basDt={} 에 해당하는 데이터 없음", latestBasDt);
            return;
        }

        log.info("최신 기준일 {} → {}개 종목으로 랭킹 생성", latestBasDt, allStocks.size());

        String volumeKey = "rank:volume:" + latestBasDt;
        String riseKey   = "rank:rise:"   + latestBasDt;
        String fallKey   = "rank:fall:"   + latestBasDt;
        String trPrcKey  = "rank:trPrc:"  + latestBasDt;

        // 기존 키 삭제 (새로 덮어쓰기)
        redisTemplate.delete(List.of(volumeKey, riseKey, fallKey, trPrcKey));

        for (StockKoreaDTO s : allStocks) {
            String id = s.getId();

            zSet.add(volumeKey, id, (double) s.getTrqu());
            zSet.add(trPrcKey,  id, (double) s.getTrPrc());
            zSet.add("rank:marketcap", id, (double) s.getMrktTotAmt());

            if (s.getFltRt() > 0.0) {
                zSet.add(riseKey, id, s.getFltRt());
            }
            if (s.getFltRt() < 0.0) {
                zSet.add(fallKey, id, -s.getFltRt());  // 하락률은 절댓값
            }
        }

        log.info("모든 랭킹 갱신 완료! 기준일: {} ({}개 종목)", latestBasDt, allStocks.size());
    }

    // 모든 get 메서드에 On-Demand 보험 추가
    private List<StockKoreaDTO> getRank(String keyPrefix, int limit) {
        String latestBasDt = stockKoreaDAO.findFirstByOrderByBasDtDesc()
                .map(StockKoreaDTO::getBasDt)
                .orElse("000000");

        String key = "rank:marketcap".equals(keyPrefix) ? "rank:marketcap" : keyPrefix + ":" + latestBasDt;

        Long size = zSet.size(key);
        if (size == null || size == 0) {
            log.warn("Redis에 {} 랭킹 없음 → 즉시 갱신 실행!", key);
            refreshLatestRank();  // 동기 강제 갱신
        }

        Set<ZSetOperations.TypedTuple<String>> tuples = zSet.reverseRangeWithScores(key, 0, limit - 1);
        if (tuples == null || tuples.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> ids = tuples.stream()
                .map(ZSetOperations.TypedTuple::getValue)
                .filter(Objects::nonNull)
                .toList();

        List<StockKoreaDTO> stocks = stockKoreaDAO.findByIdIn(ids);
        Map<String, StockKoreaDTO> stockMap = stocks.stream()
                .collect(Collectors.toMap(StockKoreaDTO::getId, v -> v, (v1, v2) -> v1));

        List<StockKoreaDTO> result = new ArrayList<>();
        int rank = 1;
        double prevScore = -1.0;

        for (ZSetOperations.TypedTuple<String> tuple : tuples) {
            String id = tuple.getValue();
            Double score = tuple.getScore();
            if (id == null || score == null) continue;

            StockKoreaDTO stock = stockMap.get(id);
            if (stock == null) continue;

            // 동순위 처리
            if (prevScore != -1.0 && Math.abs(prevScore - score) > 0.00001) {
                rank = result.size() + 1;
            }

            stock.setRank(rank);
            result.add(stock);
            prevScore = score;
        }

        return result;
    }

    @Override public List<StockKoreaDTO> getVolumeTop100()     { return getRank("rank:volume", 100); }
    @Override public List<StockKoreaDTO> getRiseTop100()       { return getRank("rank:rise", 100); }
    @Override public List<StockKoreaDTO> getFallTop100()       { return getRank("rank:fall", 100); }
    @Override public List<StockKoreaDTO> getTradePriceTop100() { return getRank("rank:trPrc", 100); }
    @Override public List<StockKoreaDTO> getMarketCapTop100()  { return getRank("rank:marketcap", 100); }
}