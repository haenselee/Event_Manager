package com.example.dipl.login;

import com.example.dipl.register.RegisterRequest;
import com.example.dipl.login.JwtService;
import com.example.dipl.user.Role;
import com.example.dipl.user.User;
import com.example.dipl.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private final UserRepository userRepo;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepo,
                          JwtService jwtService,
                          PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        User user = userRepo.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Falsches Passwort");
        }

        String accessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getUsername(),
                user.getRole().name()
        );

        String refreshToken = jwtService.generateRefreshToken(
                user.getId(),
                user.getUsername()
        );

        return new LoginResponse(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                accessToken,
                refreshToken
        );
    }

    @PostMapping("/register")
    public LoginResponse register(@RequestBody RegisterRequest request) {
        userRepo.findByUsername(request.getUsername()).ifPresent(u -> {
            throw new RuntimeException("Benutzername bereits vergeben");
        });

        Role role = request.getRole() != null ? request.getRole() : Role.STUDENT;

        User user = new User(
                request.getUsername(),
                passwordEncoder.encode(request.getPassword()), // 🔐 WICHTIG
                role
        );

        User saved = userRepo.save(user);

        String accessToken = jwtService.generateAccessToken(
                saved.getId(),
                saved.getUsername(),
                saved.getRole().name()
        );

        String refreshToken = jwtService.generateRefreshToken(
                saved.getId(),
                saved.getUsername()
        );

        return new LoginResponse(
                saved.getId(),
                saved.getUsername(),
                saved.getRole(),
                accessToken,
                refreshToken
        );
    }

    @PostMapping("/refresh")
    public LoginResponse refresh(@RequestBody RefreshRequest request) {
        String refreshToken = request.getRefreshToken();

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new RuntimeException("Refresh Token fehlt");
        }

        if (!jwtService.isTokenValid(refreshToken)) {
            throw new RuntimeException("Ungültiger oder abgelaufener Refresh Token");
        }

        if (!"refresh".equals(jwtService.extractTokenType(refreshToken))) {
            throw new RuntimeException("Falscher Token-Typ");
        }

        String username = jwtService.extractUsername(refreshToken);

        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));

        String newAccessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getUsername(),
                user.getRole().name()
        );

        String newRefreshToken = jwtService.generateRefreshToken(
                user.getId(),
                user.getUsername()
        );

        return new LoginResponse(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                newAccessToken,
                newRefreshToken
        );
    }
}