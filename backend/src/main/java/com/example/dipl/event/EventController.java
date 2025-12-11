package com.example.dipl.event;

import com.example.dipl.chat.EventMessageRepository;
import com.example.dipl.register.RegistrationRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:4200")
public class EventController {

    private final EventMessageRepository messageRepo;
    private final EventRepository eventRepo;
    private final RegistrationRepository regRepo;

    public EventController(EventMessageRepository messageRepo, EventRepository repo, RegistrationRepository regRepo) {
        this.messageRepo = messageRepo;
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
    public void deleteAllEvents() {
        regRepo.deleteAll();
        messageRepo.deleteAll();
        eventRepo.deleteAll();
    }
}
