package com.boot.service;

import com.boot.dto.DummyDTO;
import java.util.List;

public interface DummyService {
    List<DummyDTO> getAllStocks();
    List<DummyDTO> getTopStocks(int count);
}
