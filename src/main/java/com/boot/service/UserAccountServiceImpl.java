package com.boot.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.boot.dao.UserAccountDAO;
import com.boot.dto.UserAccountDTO;

@Service
public class UserAccountServiceImpl implements UserAccountService{

    @Autowired
    private UserAccountDAO dao;
    
    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
	
	@Override
	public String register(UserAccountDTO userAccountDTO) {
		 // 아이디나 이메일 중복 체크
        if (dao.findByUserId(userAccountDTO.getUser_id()) != null) {
            return "이미 사용 중인 아이디입니다.";
        }

        if (dao.findByEmail(userAccountDTO.getEmail()) != null) {
            return "이미 사용 중인 이메일입니다.";
        }
        
        String encodedPassword = passwordEncoder.encode(userAccountDTO.getUser_password());
        userAccountDTO.setUser_password(encodedPassword);
        
        dao.insertUserAccount(userAccountDTO);  // XML 쿼리로 저장
        return "회원가입이 성공적으로 완료되었습니다.";
    }

	@Override
    public UserAccountDTO login(String userId, String rawPassword) {

        // 아이디로 사용자 조회
        UserAccountDTO user = dao.findByUserId(userId);

        if (user == null) {
            return null;   // 아이디 없음
        }

        // 비밀번호 매칭
        if (!passwordEncoder.matches(rawPassword, user.getUser_password())) {
            return null;   // 비밀번호 틀림
        }

        // 로그인 성공
        return user;
    }
}
