package com.boot.service;

import com.boot.dao.StockKospiRepository;
import com.boot.dto.StockKospiDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StockKospiServiceImpl implements StockKospiService {

    private final StockKospiRepository repository;

    @Override
    public List<StockKospiDTO> findAll() {
        return repository.findAll();
    }
}
