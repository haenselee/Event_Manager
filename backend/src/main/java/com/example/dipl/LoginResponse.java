package com.example.dipl;


public class LoginResponse {
    private Long id;
    private String username;
    private Role role;

    public LoginResponse(Long id, String username, Role role) {
        this.id = id;
        this.username = username;
        this.role = role;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public Role getRole() { return role; }
}
