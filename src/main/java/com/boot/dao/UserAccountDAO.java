package com.boot.dao;

import java.util.ArrayList;
import java.util.HashMap;

import org.apache.ibatis.annotations.Mapper;

import com.boot.dto.UserAccountDTO;

@Mapper
public interface UserAccountDAO {
	// 아이디로 사용자 조회
    UserAccountDTO findByUserId(String userId);

    // 이메일로 사용자 조회
    UserAccountDTO findByEmail(String email);
    
    int insertUserAccount(UserAccountDTO userAccountDTO);
    
    public ArrayList<UserAccountDTO> loginYn(HashMap<String, String>param);
}
