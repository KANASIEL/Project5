package com.boot.service;

import com.boot.dto.StockDetailNewsDTO;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class StockDetailServiceImpl implements StockDetailService {
    @Override
    public List<StockDetailNewsDTO> getNews(String code) {
        List<StockDetailNewsDTO> newsList = new ArrayList<>();
        try {
            Document doc = Jsoup.connect("https://finance.naver.com/item/main.naver?code=" + code)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();

            Elements items = doc.select(".sub_section.news_section li");
            if (items != null) {
                for (Element item : items) {
                    Element titleEl = item.selectFirst(".txt a");
                    if (titleEl == null) continue;

                    StockDetailNewsDTO news = new StockDetailNewsDTO();
                    news.setTitle(titleEl.text().trim());
                    news.setLink("https://finance.naver.com" + titleEl.attr("href"));

                    String date = "";
                    String related = null;
                    for (Element em : item.select("em")) {
                        if (em.parent() != null && em.parent().classNames().contains("link_relation")) {
                            related = em.text().trim();
                        } else {
                            date = em.text().trim();
                        }
                    }

                    news.setDate(date.isEmpty() ? "최근" : date);
                    news.setRelated(related);
                    newsList.add(news);
                }
            }
            return newsList.stream().limit(10).toList();
        } catch (Exception e) {
            e.printStackTrace();
            return newsList;
        }
    }

    @Override
    public String getChartUrl(String code, String type, String period) {
        try {
            String baseUrl = "https://ssl.pstatic.net/imgfinance/chart/item/";
            return String.format("%s%s/%s/%s.png?sidcode=%d",
                    baseUrl, type, period, code, System.currentTimeMillis());
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }
}
