package com.boot.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.boot.dto.UserAccountDTO;
import com.boot.service.UserAccountService;
import com.boot.util.JwtUtil;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api")
public class UserAccountController {

	@Autowired
    private UserAccountService userAccountService;
	
	@Autowired
	private JwtUtil jwtUtil;

    // 회원가입 처리
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody UserAccountDTO userAccountDTO) {
        String result = userAccountService.register(userAccountDTO);
        return ResponseEntity.ok(result);  // 성공 메시지를 반환
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserAccountDTO dto) {

        UserAccountDTO user = userAccountService.login(dto.getUser_id(), dto.getUser_password());

        if (user == null) {
            return ResponseEntity.badRequest().body("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        user.setUser_password(null); // 비밀번호 제거

        // JWT 발급
        String token = jwtUtil.createToken(user.getUser_id(), "LOCAL");

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", user);

        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/info")
    public ResponseEntity<?> getUserInfo(@RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("토큰 없음");
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).body("유효하지 않은 토큰");
        }

        String userId = jwtUtil.getUsername(token);

        UserAccountDTO user = userAccountService.findUserInfo(userId);

        return ResponseEntity.ok(user);
    }
    
    @PostMapping("/modifyUser")
    public int modifyUser(
            @RequestParam("user_id") String userId,
            @RequestParam("email") String email,
            @RequestParam("nickname") String nickname,
            @RequestParam(value = "user_password", required = false) String userPassword,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage
    ) {
        try {
            UserAccountDTO account = new UserAccountDTO();
            account.setUser_id(userId);
            account.setEmail(email);
            account.setNickname(nickname);
            account.setUser_password(userPassword);

            if (profileImage != null && !profileImage.isEmpty()) {
                String savedFileName = userAccountService.saveProfileImage(profileImage);
                account.setProfileImage(savedFileName);
            }

            return userAccountService.updateUserInfo(account); // 성공하면 1 반환
        } catch (Exception e) {
            e.printStackTrace();
            return 0; // 실패
        }
    }


    
    @PostMapping("/deleteUser")
    public int deleteUser(HttpSession session) {

        String userId = (String) session.getAttribute("userId");
        String loginType = (String) session.getAttribute("loginType");

        if (userId == null || loginType == null) {
            System.out.println("❌ 세션 정보 없음 → 실패");
            return 0;
        }

        int result = userAccountService.deleteUser(userId, loginType);

        if (result > 0) session.invalidate();
        return result;
    }

}
