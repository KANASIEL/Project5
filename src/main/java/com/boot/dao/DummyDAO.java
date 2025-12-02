package com.boot.dao;

import com.boot.dto.DummyDTO;

import java.util.List;

public interface DummyDAO {
    List<DummyDTO> selectAllStocks();

    List<DummyDTO> selectTopStocks(int count);
}