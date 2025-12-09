package com.boot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer; // 💡 임포트 추가

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. CSRF 비활성화
                .csrf(AbstractHttpConfigurer::disable)

                // 2. CORS 비활성화 (전역 CORS 설정이 따로 없는 경우)
                // 실제 배포 시에는 반드시 필요한 오리진만 허용하는 설정을 해야 합니다.
                .cors(AbstractHttpConfigurer::disable)

                // 3. HTTP 요청 권한 설정 (경로 수정)
                .authorizeHttpRequests(auth -> auth
                        // ⭐️ /api/register 와 /api/login 허용
                        .requestMatchers("/api/register", "/api/login").permitAll()

                        // 나머지 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}