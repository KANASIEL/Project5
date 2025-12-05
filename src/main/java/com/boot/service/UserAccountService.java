package com.boot.service;

import com.boot.dto.UserAccountDTO;

public interface UserAccountService {
	//회원가입
	String register(UserAccountDTO userAccountDTO);

	UserAccountDTO login(String userId, String password);
}
