package com.boot.controller;

import com.boot.dto.DummyDTO;
import com.boot.service.DummyService;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DummyController {

    private final DummyService dummyService;

    public DummyController(DummyService dummyService) {
        this.dummyService = dummyService;
    }

    @GetMapping("/stocks")
    public ResponseEntity<Map<String, Object>> getAllStocks() {
        List<DummyDTO> stocks = dummyService.getAllStocks();
        Map<String, Object> response = new HashMap<>();
        response.put("stocks", stocks);
        return ResponseEntity.ok(response);
    }
}
