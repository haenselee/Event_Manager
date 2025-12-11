package com.example.dipl.login;

import com.example.dipl.register.RegisterRequest;
import com.example.dipl.user.Role;
import com.example.dipl.user.User;
import com.example.dipl.user.UserRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private final UserRepository userRepo;

    public AuthController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        User user = userRepo.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));

        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Falsches Passwort");
        }

        return new LoginResponse(user.getId(), user.getUsername(), user.getRole());
    }

    @PostMapping("/register")
    public LoginResponse register(@RequestBody RegisterRequest request) {
        userRepo.findByUsername(request.getUsername()).ifPresent(u -> {
            throw new RuntimeException("Benutzername bereits vergeben");
        });

        // wenn rolle nicht gesetzt dann default STUDENT
        Role role = request.getRole() != null ? request.getRole() : Role.STUDENT;

        User user = new User(request.getUsername(), request.getPassword(), role);
        User saved = userRepo.save(user);

        return new LoginResponse(saved.getId(), saved.getUsername(), saved.getRole());
    }
}
