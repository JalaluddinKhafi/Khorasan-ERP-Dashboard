package com.amini.khorasan;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

  @Bean
  PasswordEncoder encoder() {
    return new BCryptPasswordEncoder();
  }
      var u = rows.get(0);
      return User.withUsername(username)
        .password((String) u.get("password"))
        .roles((String) u.get("role"))
        .build();
    };
  }

  @Bean
  ApplicationRunner bootstrap(
    JdbcTemplate db,
    PasswordEncoder encoder,
    @Value("${app.admin.username}") String username,
    @Value("${app.admin.password}") String password
  ) {
    return args -> {
