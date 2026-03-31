package com.example.dipl;

import com.example.dipl.login.AuthController;
import com.example.dipl.login.JwtService;
import com.example.dipl.login.LoginRequest;
import com.example.dipl.login.LoginResponse;
import com.example.dipl.user.Role;
import com.example.dipl.user.User;
import com.example.dipl.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerJwtTest {

    @Mock
    private UserRepository userRepo;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthController authController;

    @Test
    void login_shouldReturnAccessAndRefreshToken_whenCredentialsAreCorrect() {
        LoginRequest request = new LoginRequest();
        request.setUsername("anna");
        request.setPassword("secret");

        User user = new User("anna", "encodedPw", Role.STUDENT);
        user.setId(7L);

        when(userRepo.findByUsername("anna")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "encodedPw")).thenReturn(true);
        when(jwtService.generateAccessToken(7L, "anna", "STUDENT")).thenReturn("jwt-access-token");
        when(jwtService.generateRefreshToken(7L, "anna")).thenReturn("jwt-refresh-token");

        LoginResponse response = authController.login(request);

        assertNotNull(response);
        assertEquals(7L, response.getId());
        assertEquals("anna", response.getUsername());
        assertEquals(Role.STUDENT, response.getRole());
        assertEquals("jwt-access-token", response.getAccessToken());
        assertEquals("jwt-refresh-token", response.getRefreshToken());

        verify(userRepo).findByUsername("anna");
        verify(passwordEncoder).matches("secret", "encodedPw");
        verify(jwtService).generateAccessToken(7L, "anna", "STUDENT");
        verify(jwtService).generateRefreshToken(7L, "anna");
    }
}