package com.boot.controller;

import java.util.HashMap;  
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping; 
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.boot.dto.AppUserDTO;
import com.boot.service.AppUserService;
import com.boot.util.JwtUtil;

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

	    //socialType 자동 감지 (프론트가 안 보내도 처리됨)
	    String socialType = dto.getSocialType();

	    if (socialType == null) {
	        if (dto.getKakaoId() != null) socialType = "KAKAO";
	        else if (dto.getNaverId() != null) socialType = "NAVER";
	        else return ResponseEntity.status(400).body("socialType not provided");
	    }

	    //회원 조회 또는 자동 가입
	    AppUserDTO user = userService.loginOrRegister(dto);

	    if (user == null) {
	        return ResponseEntity.status(401).body("Login failed.");
	    }

	    //JWT 생성
	    String token = jwtUtil.createToken(
	            socialType.equals("KAKAO") ? user.getKakaoId() : user.getNaverId(),
	            socialType
	    );

	    //응답 구성
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