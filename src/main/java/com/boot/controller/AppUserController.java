package com.boot.controller;

import java.util.HashMap; 
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping; 
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.boot.dto.AppUserDTO;
import com.boot.service.AppUserService;
import com.boot.util.JwtUtil;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AppUserController {

	@Autowired
    private AppUserService userService;
	
	@Autowired
	private JwtUtil jwtUtil;

	
    // 회원 가입 및 로그인 처리
	@PostMapping("/loginOrRegister")
	public ResponseEntity<?> loginOrRegister(@RequestBody AppUserDTO dto) {

	    AppUserDTO user = userService.loginOrRegister(dto);

	    if (user == null) {
	        return ResponseEntity.status(401).body("Login failed.");
	    }

	    // JWT 토큰 발급
	    String token = jwtUtil.createToken(user.getKakaoId(),"KAKAO");

	    // 프론트에 내려줄 응답 형태
	    Map<String, Object> response = new HashMap<>();
	    response.put("user", user);
	    response.put("token", token);

	    return ResponseEntity.ok(response);
	}

    
    //로그아웃
    @PostMapping("/logout")
    public Map<String, Object> logout() {
        Map<String, Object> result = new HashMap<>();

        result.put("message", "로그아웃 되었습니다.");
        return result;
    }
}