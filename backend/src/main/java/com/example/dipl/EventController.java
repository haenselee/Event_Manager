package com.example.dipl;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class EventController {

    private final EventRepository repo;

    public EventController(EventRepository repo) {
        this.repo = repo;
    }

    // alle kommenden Events
    @GetMapping
    public List<Event> getUpcomingEvents() {
        return repo.findAll();
    }

    // Event nach ID
    @GetMapping("/{id}")
    public Event getEvent(@PathVariable Long id) {
        return repo.findById(id).orElseThrow();
    }

    // neues Event anlegen (für Klassenvorstand)
    @PostMapping
    public Event createEvent(@RequestBody Event event) {
        return repo.save(event);
    }
}
