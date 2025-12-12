package com.boot.dao;

import com.boot.dto.StockGlobalNews;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StockGlobalNewsRepository extends MongoRepository<StockGlobalNews, String> {

    Page<StockGlobalNews> findBySource(String source, Pageable pageable);

    Page<StockGlobalNews> findByRegionAndTitleContainingIgnoreCase(String region, String title, Pageable pageable);

    Page<StockGlobalNews> findByRegionAndSourceAndTitleContainingIgnoreCase(String region, String source, String title, Pageable pageable);
}