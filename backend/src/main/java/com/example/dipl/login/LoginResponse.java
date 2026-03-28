package com.example.dipl.login;

import com.example.dipl.user.Role;

public class LoginResponse {
    private Long id;
    private String username;
    private Role role;
    private String accessToken;
    private String refreshToken;

    public LoginResponse(Long id, String username, Role role, String accessToken, String refreshToken) {
        this.id = id;
        this.username = username;
        this.role = role;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public Role getRole() { return role; }
    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }
}