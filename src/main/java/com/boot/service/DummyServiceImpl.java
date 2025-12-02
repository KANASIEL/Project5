package com.boot.service;

import com.boot.dao.DummyDAO;
import com.boot.dto.DummyDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DummyServiceImpl implements DummyService {

    private final DummyDAO dummyDAO;

    public DummyServiceImpl(DummyDAO dummyDAO) {
        this.dummyDAO = dummyDAO;
    }

    @Override
    public List<DummyDTO> getAllStocks() {
        return dummyDAO.selectAllStocks();
    }

    @Override
    public List<DummyDTO> getTopStocks(int count) {
        return dummyDAO.selectTopStocks(count);
    }
}
