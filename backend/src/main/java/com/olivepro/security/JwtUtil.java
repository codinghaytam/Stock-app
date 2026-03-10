package com.olivepro.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(@Value("${app.jwt.secret}") String secret,
                   @Value("${app.jwt.expiration-ms}") long expirationMs) {
        // secret should be a base64-encoded string or long random string
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expirationMs = expirationMs;
    }

    public String generateToken(String username, Map<String, Object> claims) {
        long now = System.currentTimeMillis();
        String token = Jwts.builder()
                .setSubject(username)
                .addClaims(claims)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
        log.debug("Generated token for {} (expires in {} ms)", username, expirationMs);
        return token;
    }

    public Claims parseClaims(String token) throws JwtException {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload(); // just to verify signature first
        } catch (JwtException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            throw e;
        }
    }

    public boolean isTokenValid(String token, String username) {
        try {
            final Claims claims = parseClaims(token);
            String subj = claims.getSubject();
            boolean valid = (subj != null && subj.equals(username) && claims.getExpiration().after(new Date()));
            if (!valid) log.debug("Token invalid for user {}", username);
            return valid;
        } catch (JwtException e) {
            return false;
        }
    }

}
