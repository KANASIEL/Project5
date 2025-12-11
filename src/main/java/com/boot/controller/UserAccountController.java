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
    public ResponseEntity<?> modifyUser(
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

            int result = userAccountService.updateUserInfo(account);

            if (result == 1) {

                // 🔥 DB에서 loginType 가져오기 (LOCAL / KAKAO / NAVER)
                String loginType = userAccountService.getLoginType(userId);

                // 🔥 generateToken() 말고 createToken() 사용
                String newToken = jwtUtil.createToken(userId, loginType);

                Map<String, Object> response = new HashMap<>();
                response.put("result", 1);
                response.put("token", newToken);

                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.ok(Map.of("result", 0));
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error");
        }
    }


    
    @PostMapping("/deleteUser")
    public ResponseEntity<?> deleteUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("토큰 없음");
            }

            String token = authHeader.substring(7);

            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(401).body("유효하지 않은 토큰");
            }

            String userId = jwtUtil.getUsername(token);
            String loginType = jwtUtil.getLoginType(token);

            // null 체크
            if (userId == null || loginType == null) {
                return ResponseEntity.status(400).body("userId 또는 loginType이 null");
            }

            int result = userAccountService.deleteUser(userId, loginType);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace(); // 서버 로그 확인
            return ResponseEntity.status(500).body("서버 오류 발생");
        }
    }

}
