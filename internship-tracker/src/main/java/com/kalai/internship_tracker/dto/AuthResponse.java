
package com.kalai.internship_tracker.dto;

public class AuthResponse {

    private Long userId;
    private String name;
    private String email;
    private String message;
    private String token;

    public AuthResponse() {
    }

    public AuthResponse(Long userId, String name, String email,
                        String message, String token) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.message = message;
        this.token = token;
    }

    public AuthResponse(Long userId, String name, String email, String message) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.message = message;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
