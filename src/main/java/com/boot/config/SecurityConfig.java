package com.boot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration 
public class SecurityConfig {

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	    http
	        .csrf(csrf -> csrf.disable()) // Post 요청 CSRF 차단 제거 (필요한 경우만)
	        .authorizeHttpRequests(auth -> auth
	            .requestMatchers("/register").permitAll()  // <-- 여기를 꼭 추가!
	            .anyRequest().authenticated()
	        );

	    return http.build();
	}
}
