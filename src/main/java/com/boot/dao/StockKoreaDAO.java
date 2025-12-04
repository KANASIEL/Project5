package com.boot.dao;

import com.boot.dto.StockKoreaDTO;
import org.apache.ibatis.annotations.Param;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StockKoreaDAO extends MongoRepository<StockKoreaDTO, String> {
    // 하루 전 날짜 기준 전체 리스트
    List<StockKoreaDTO> findByBasDt(@Param("basDt") String basDt);

    // 하루 전 날짜 기준 + 검색어 필터링
    @Query("{ 'basDt': ?0, $or: [ { 'itmsNm': { $regex: ?1, $options: 'i' } }, { 'srtnCd': { $regex: ?1, $options: 'i' } } ] }")
    List<StockKoreaDTO> findByBasDtAndKeyword(@Param("basDt") String basDt,@Param("keyword") String keyword);

    // 또는 더 간단하게 (id에 날짜 포함되어 있으므로 이거만 있어도 충분!)
    List<StockKoreaDTO> findByIdIn(List<String> ids);
    // 이 메서드만 추가하면 끝!
    Optional<StockKoreaDTO> findFirstByOrderByBasDtDesc();
}
