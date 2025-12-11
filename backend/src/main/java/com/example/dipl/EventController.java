package com.example.dipl;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:4200")
public class EventController {

    private final EventRepository eventRepo;
    private final RegistrationRepository regRepo;

    public EventController(EventRepository repo, RegistrationRepository regRepo) {
        this.eventRepo = repo;
        this.regRepo = regRepo;
    }

    @GetMapping
    public List<Event> getAllEvents() {
        return eventRepo.findAll();
    }

    @GetMapping("/{id}")
    public Event getEvent(@PathVariable Long id) {
        return eventRepo.findById(id).orElseThrow();
    }

    @PostMapping
    public Event createEvent(@RequestBody Event event) {
        return eventRepo.save(event);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAllEvents() {
        regRepo.deleteAll();
        eventRepo.deleteAll();
        return ResponseEntity.noContent().build();
    }
}
