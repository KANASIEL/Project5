package com.boot.dto;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "stock_daily_prices")
public class StockKoreaDTO {
    // MongoDB의 _id 필드에 매핑됩니다. (예: "20251202_900110")
    @Id
    private String id;

    // 기준일자 (20251202)
    private String basDt;

    // 단축코드 (900110)
    private String srtnCd;

    // ISIN코드 (HK0000057197)
    private String isinCd;

    // 종목명 (이스트아시아홀딩스)
    private String itmsNm;

    // 시장구분 (KOSDAQ)
    private String mrktCtg;

    // 종가 (1134) - 시세는 보통 int 또는 long
    private int clpr;

    // 전일 대비 (-3)
    private int vs;

    // 등락률 (-0.26) - 소수점이 있으므로 double
    private double fltRt;

    // 시가 (1146)
    private int mkp;

    // 고가 (1149)
    private int hipr;

    // 저가 (1133)
    private int lopr;

    // 거래량 (73824) - 대규모 숫자를 위해 long 사용 권장
    private long trqu;

    // 거래대금 (83948981)
    private long trPrc;

    // 상장주식수 (26286743)
    private long lstgStCnt;

    // 시가총액 (29809166562) - 매우 큰 숫자이므로 long 사용
    private long mrktTotAmt;

    // 여기부터 추가 (3줄)
    // 프론트에 순위 보여주기 위한 임시 필드 (DB에 저장되진 않음)
    private int rank;

    // 필요하면 점수도 함께 보낼 수 있음
    private double score;
}
