package com.boot.controller;

import org.springframework.beans.factory.annotation.Autowired; 
import org.springframework.web.bind.annotation.PostMapping; 
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.boot.dto.AppUserDTO;
import com.boot.service.AppUserService;

@RestController
@RequestMapping("/api/auth")
public class AppUserController {

	@Autowired
    private AppUserService userService;
	
    // 회원 가입 및 로그인 처리
    @PostMapping("/loginOrRegister")
    public AppUserDTO loginOrRegister(@RequestBody AppUserDTO dto) {
  
        return userService.loginOrRegister(dto);
    }
}