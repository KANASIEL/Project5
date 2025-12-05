package com.boot.dao;

import com.boot.dto.StockKosdaqDTO;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StockKosdaqRepository extends MongoRepository<StockKosdaqDTO, String> {
}