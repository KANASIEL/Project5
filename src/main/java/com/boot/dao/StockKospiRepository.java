package com.boot.dao;

import com.boot.dto.StockKospiDTO;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockKospiRepository extends MongoRepository<StockKospiDTO, String> {
    StockKospiDTO findByCode(String code);
}