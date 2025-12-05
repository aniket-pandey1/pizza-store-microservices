package com.pizzastore.userservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF for stateless REST API
            .cors(cors -> cors.disable()) // Disable CORS security filter (we use @CrossOrigin)
            .authorizeHttpRequests(auth -> auth
                // Allow PUBLIC access to register, login, and detail fetching endpoints
                .requestMatchers(
                    new AntPathRequestMatcher("/users/register"),
                    new AntPathRequestMatcher("/users/login"),
                    new AntPathRequestMatcher("/users/detail/*"),
                    new AntPathRequestMatcher("/users/detail/id/*"),
                    new AntPathRequestMatcher("/users/all") 
                ).permitAll()
                // Require authentication for all other requests (Admin CRUD, if secured)
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // Use stateless sessions (for JWT)
            );

        return http.build();
    }
}