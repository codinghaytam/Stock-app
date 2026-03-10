package com.olivepro.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private ResponseEntity<Map<String, Object>> buildResponse(Exception ex, HttpStatus status, HttpServletRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", ex.getMessage());
        body.put("path", request.getRequestURI());
        log.error("Exception handled: {} {} -> {}", request.getMethod(), request.getRequestURI(), ex.getMessage(), ex);
        return new ResponseEntity<>(body, status);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return buildResponse(ex, HttpStatus.NOT_FOUND, request);
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<Map<String, Object>> handleInsufficient(InsufficientStockException ex, HttpServletRequest request) {
        return buildResponse(ex, HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<Map<String, Object>> handleBusiness(BusinessRuleException ex, HttpServletRequest request) {
        return buildResponse(ex, HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(UnauthorizedException ex, HttpServletRequest request) {
        return buildResponse(ex, HttpStatus.FORBIDDEN, request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return buildResponse(ex, HttpStatus.FORBIDDEN, request);
    }

    @ExceptionHandler(org.springframework.security.authentication.LockedException.class)
    public ResponseEntity<Map<String, Object>> handleLocked(org.springframework.security.authentication.LockedException ex, HttpServletRequest request) {
        return buildResponse(ex, HttpStatus.FORBIDDEN, request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String details = ex.getFieldErrors().stream().map(fe -> fe.getField() + ": " + fe.getDefaultMessage()).collect(Collectors.joining(", "));
        Exception wrapper = new Exception("Validation failed: " + details);
        return buildResponse(wrapper, HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex, HttpServletRequest request) {
        return buildResponse(ex, HttpStatus.INTERNAL_SERVER_ERROR, request);
    }
}
