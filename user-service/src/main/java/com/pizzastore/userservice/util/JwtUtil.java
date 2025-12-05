package com.pizzastore.userservice.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class JwtUtil {

    private static final String SECRET_KEY = "YourSuperSecretKeyThatIsAtLeast256BitsLongAndShouldBeSecured"; 
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 10; // 10 hours

    /**
     * Generates a JWT token containing username and role claims.
     * @param username The user's username.
     * @param role The user's role (CUSTOMER or ADMIN).
     * @return The signed JWT string.
     */
    public static String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SignatureAlgorithm.HS256, SECRET_KEY.getBytes()) 
                .compact();
    }
}