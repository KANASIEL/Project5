package com.boot.dto;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "test") // MongoDB 컬렉션 이름
public class DummyDTO {

    @Id
    private String id;

    private String N;
    private String 종목명;
    private String 현재가;
    private String 전일비;
    private String 등락률;
    private String 액면가;
    private String 시가총액;
    private String 상장주식수;
    private String 외국인비율;
    private String 거래량;
    private String PER;
    private String ROE;
}
