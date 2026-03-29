package com.example.dipl.user;

import com.example.dipl.chat.EventMessageRepository;
import com.example.dipl.register.RegistrationRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    private final UserRepository userRepo;
    private final RegistrationRepository registrationRepository;
    private final EventMessageRepository eventMessageRepository;

    public UserController(
            UserRepository userRepo,
            RegistrationRepository registrationRepository,
            EventMessageRepository eventMessageRepository
    ) {
        this.userRepo = userRepo;
        this.registrationRepository = registrationRepository;
        this.eventMessageRepository = eventMessageRepository;
    }

    @GetMapping
    public List<User> getAll() {
        return userRepo.findAll();
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        User user = userRepo.findById(id).orElseThrow();

        // zuerst abhängige Datensätze löschen
        registrationRepository.deleteByStudent_Id(id);
        eventMessageRepository.deleteByAuthor_Id(id);

        // danach den User selbst löschen
        userRepo.delete(user);

        return ResponseEntity.noContent().build();
    }
}