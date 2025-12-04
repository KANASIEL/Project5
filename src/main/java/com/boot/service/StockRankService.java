package com.boot.service;

import com.boot.dto.StockKoreaDTO;
import java.util.List;

public interface StockRankService {

    // 랭킹 강제 갱신 (필요시 수동 호출 가능)
    void refreshLatestRank();

    List<StockKoreaDTO> getVolumeTop100();
    List<StockKoreaDTO> getRiseTop100();
    List<StockKoreaDTO> getFallTop100();
    List<StockKoreaDTO> getTradePriceTop100();
    List<StockKoreaDTO> getMarketCapTop100();
}