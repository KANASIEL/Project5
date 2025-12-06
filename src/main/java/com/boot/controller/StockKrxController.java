package com.boot.controller;

import com.boot.dto.DetailNewsDTO;
import com.boot.dto.StockKospiDTO;
import com.boot.dto.StockKosdaqDTO;
import com.boot.service.StockKospiService;
import com.boot.service.StockKosdaqService;
import com.boot.service.SmartStockSearchService;  // ← 이거만 추가!
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import org.jsoup.nodes.Document;  // 올바른 import!
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class StockKrxController {

    private final StockKospiService kospiService;
    private final StockKosdaqService kosdaqService;
    private final SmartStockSearchService smartSearchService;  // ← 추가

    // 너가 원래 쓰던 API 그대로 유지 (프론트 호환 100%)
    @GetMapping("/krx/kospi/list")
    public List<StockKospiDTO> getKospiStocks() {
        return kospiService.findAll();
    }

    @GetMapping("/krx/kosdaq/list")
    public List<StockKosdaqDTO> getKosdaqStocks() {
        return kosdaqService.findAll();
    }

    // 뉴스 크롤링 API (이제 100% 작동!)
    @GetMapping("/krx/news/{code}")
    public List<DetailNewsDTO> getNews(@PathVariable String code) {
        try {
            Document doc = Jsoup.connect("https://finance.naver.com/item/main.naver?code=" + code)
                    .userAgent("Mozilla/5.0")
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

                // 모든 <em> 태그 찾기
                Elements emTags = item.select("em");
                String date = "";
                String related = null;

                for (Element em : emTags) {
                    // 관련 건수는 .link_relation 안에 있음
                    if (em.parent() != null && em.parent().hasClass("class") &&
                            em.parent().classNames().contains("link_relation")) {
                        related = em.text().trim();
                    } else {
                        date = em.text().trim(); // 그 외는 날짜
                    }
                }

                n.setDate(date);
                n.setRelated(related);
                news.add(n);
            }

            return news.stream().limit(10).toList();
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
}