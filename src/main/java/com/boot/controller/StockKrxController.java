// src/main/java/com/boot/controller/StockKrxController.java
package com.boot.controller;

import com.boot.dto.*;
import com.boot.service.*;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class StockKrxController {

    private final StockKospiService kospiService;
    private final StockKosdaqService kosdaqService;
    private final RecentStockService recentStockService;
    private final RankingService rankingService;
    private final FavoriteStockService favoriteStockService;
    private final StockCacheService stockCacheService;

// ==================== 즐겨찾기 API ====================

    // 즐겨찾기 목록 조회
    @GetMapping("/krx/favorites")
    public List<StockSimpleDTO> getFavorites() {
        String userId = getCurrentUserId();  // 아래에 있는 메서드 사용
        return favoriteStockService.getFavorites(userId);
    }

    // 즐겨찾기 추가
    @PostMapping("/krx/favorites/add")
    public ResponseEntity<Void> addFavorite(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        String name = body.get("name");
        if (code == null || name == null) {
            return ResponseEntity.badRequest().build();
        }
        favoriteStockService.addFavorite(getCurrentUserId(), code, name);
        return ResponseEntity.ok().build();
    }

    // 즐겨찾기 삭제
    @DeleteMapping("/krx/favorites/remove")
    public ResponseEntity<Void> removeFavorite(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null) {
            return ResponseEntity.badRequest().build();
        }
        favoriteStockService.removeFavorite(getCurrentUserId(), code);
        return ResponseEntity.ok().build();
    }

    // 현재 로그인한 사용자 ID 가져오기 (JWT 기반)
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())
                ? auth.getName()
                : "guest";  // 로그인 안 된 경우 (테스트용)
    }

    // ---------- 기존 메서드 (캐시 적용) ----------
    @GetMapping("/krx/kospi/list")
    public List<Map<String, Object>> getKospiList() {
        return stockCacheService.getKospiList();
    }

    @GetMapping("/krx/kosdaq/list")
    public List<Map<String, Object>> getKosdaqList() {
        return stockCacheService.getKosdaqList();
    }

    // ---------- 종목 상세 ----------
    @GetMapping("/krx/detail/{code}")
    public Object getStockDetail(@PathVariable String code) {
        StockKospiDTO kospi = kospiService.findByCode(code);
        if (kospi != null) return kospi;
        return kosdaqService.findByCode(code);
    }

    // ---------- 뉴스 크롤링 ----------
    @GetMapping("/krx/news/{code}")
    public List<DetailNewsDTO> getNews(@PathVariable String code) {
        try {
            Document doc = Jsoup.connect("https://finance.naver.com/item/main.naver?code=" + code)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();

            Elements items = doc.select(".sub_section.news_section li");
            List<DetailNewsDTO> news = new ArrayList<>();

            for (Element item : items) {
                Element titleEl = item.selectFirst(".txt a:first-child");
                if (titleEl == null) continue;

                DetailNewsDTO n = new DetailNewsDTO();
                n.setTitle(titleEl.text().trim());
                n.setLink("https://finance.naver.com" + titleEl.attr("href"));

                String date = "";
                String related = null;
                for (Element em : item.select("em")) {
                    if (em.parent() != null && em.parent().classNames().contains("link_relation")) {
                        related = em.text().trim();
                    } else {
                        date = em.text().trim();
                    }
                }

                n.setDate(date.isEmpty() ? "최근" : date);
                n.setRelated(related);
                news.add(n);
            }
            return news.stream().limit(10).toList();
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    // ---------- 최근 본 종목 ----------
    @PostMapping("/krx/recent/add")
    public ResponseEntity<Void> addRecentStock(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        String name = body.get("name");
        if (code != null && name != null) {
            recentStockService.addRecentStock(code, name);
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/krx/recent")
    public List<StockSimpleDTO> getRecentStocks() {
        return recentStockService.getRecentStocks();
    }

    // ---------- 거래대금 랭킹 ----------
    @GetMapping("/krx/ranking/trade")
    public List<RankingDTO> getTradeRanking() {
        return rankingService.getTradeRankingTop5();
    }

}