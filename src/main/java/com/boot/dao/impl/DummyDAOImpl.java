package com.boot.dao.impl;

import com.boot.dao.DummyDAO;
import com.boot.dto.DummyDTO;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class DummyDAOImpl implements DummyDAO {

    private final MongoTemplate mongoTemplate;

    public DummyDAOImpl(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public List<DummyDTO> selectAllStocks() {
        return mongoTemplate.findAll(DummyDTO.class);
    }

    @Override
    public List<DummyDTO> selectTopStocks(int count) {
        Query query = new Query()
                .with(Sort.by(Sort.Direction.DESC, "현재가"))
                .limit(count);
        return mongoTemplate.find(query, DummyDTO.class);
    }
}
