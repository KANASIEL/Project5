package com.boot.dao;

import com.boot.dto.StockKosdaqDTO;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockKosdaqRepository extends MongoRepository<StockKosdaqDTO, String> {
    StockKosdaqDTO findByCode(String code);
}