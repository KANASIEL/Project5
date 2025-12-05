package com.boot.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.boot.dto.UserAccountDTO;
import com.boot.service.UserAccountService;

@RestController
@RequestMapping("/api")
public class UserAccountController {

	@Autowired
    private UserAccountService userAccountService;

    // 회원가입 처리
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody UserAccountDTO userAccountDTO) {
        String result = userAccountService.register(userAccountDTO);
        return ResponseEntity.ok(result);  // 성공 메시지를 반환
    }
    
    @PostMapping("/login")
    public Object login(@RequestBody UserAccountDTO dto) {

        UserAccountDTO user = userAccountService.login(dto.getUser_id(), dto.getUser_password());

        // 로그인 실패
        if (user == null) {
            return "아이디 또는 비밀번호가 올바르지 않습니다.";
        }

        // 로그인 성공하면 유저 정보 리턴 (비밀번호는 제외)
        user.setUser_password(null);
        return user;
    }
}
