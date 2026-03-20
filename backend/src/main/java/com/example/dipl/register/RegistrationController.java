package com.example.dipl.register;

import com.example.dipl.user.User;
import com.example.dipl.user.UserRepository;
import com.example.dipl.event.Event;
import com.example.dipl.event.EventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/registrations")
@CrossOrigin(origins = "http://localhost:4200")
public class RegistrationController {

    private final RegistrationRepository regRepo;
    private final UserRepository userRepo;
    private final EventRepository eventRepo;

    public RegistrationController(RegistrationRepository regRepo, UserRepository userRepo, EventRepository eventRepo) {
        this.regRepo = regRepo;
        this.userRepo = userRepo;
        this.eventRepo = eventRepo;
    }

    @GetMapping("/me")
    public List<Registration> myRegistrations(@RequestParam Long studentId) {
        return regRepo.findByStudent_Id(studentId);
    }

    @PostMapping
    public Registration register(@RequestParam Long studentId, @RequestParam Long eventId) {
        if (regRepo.existsByStudent_IdAndEvent_Id(studentId, eventId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bereits angemeldet");
        }

        User student = userRepo.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Schüler nicht gefunden"));

        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event nicht gefunden"));

        Registration reg = new Registration();
        reg.setStudent(student);
        reg.setEvent(event);

        if (event.getPrice() == null || event.getPrice() <= 0) {
            reg.setPaid(true);
        } else {
            reg.setPaid(false);
        }

        return regRepo.save(reg);
    }

    @DeleteMapping
    public ResponseEntity<Void> unregister(@RequestParam Long studentId, @RequestParam Long eventId) {
        List<Registration> regs = regRepo.findByStudent_IdAndEvent_Id(studentId, eventId);

        if (regs.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        regRepo.deleteAll(regs);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-event")
    public List<Registration> byEvent(@RequestParam Long eventId) {
        return regRepo.findByEvent_Id(eventId);
    }
}