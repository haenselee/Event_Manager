package com.example.dipl.event;

import com.example.dipl.chat.EventMessageRepository;
import com.example.dipl.register.RegistrationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

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
        if (event.getMaxParticipants() != null && event.getMaxParticipants() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Die Obergrenze muss mindestens 1 sein");
        }

        return eventRepo.save(event);
    }

    @PutMapping("/{id}")
    public Event updateEvent(@PathVariable Long id, @RequestBody Event updatedEvent) {
        Event existingEvent = eventRepo.findById(id).orElseThrow();

        boolean hasPaidRegistrations = regRepo.existsByEvent_IdAndPaidTrue(id);
        boolean priceChanged = !Objects.equals(existingEvent.getPrice(), updatedEvent.getPrice());

        if (hasPaidRegistrations && priceChanged) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Der Preis kann nicht mehr geändert werden, weil bereits Schüler bezahlt haben"
            );
        }

        long currentRegistrations = regRepo.countByEvent_Id(id);
        if (updatedEvent.getMaxParticipants() != null && updatedEvent.getMaxParticipants() < currentRegistrations) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Die Obergrenze darf nicht kleiner als die aktuelle Anzahl an Anmeldungen sein"
            );
        }

        if (updatedEvent.getMaxParticipants() != null && updatedEvent.getMaxParticipants() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Die Obergrenze muss mindestens 1 sein");
        }

        existingEvent.setTitle(updatedEvent.getTitle());
        existingEvent.setDescription(updatedEvent.getDescription());
        existingEvent.setLocation(updatedEvent.getLocation());
        existingEvent.setDate(updatedEvent.getDate());
        existingEvent.setPrice(updatedEvent.getPrice());
        existingEvent.setMaxParticipants(updatedEvent.getMaxParticipants());

        return eventRepo.save(existingEvent);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        Event event = eventRepo.findById(id).orElseThrow();

        messageRepo.deleteByEvent_Id(id);
        regRepo.deleteByEvent_Id(id);
        eventRepo.delete(event);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public void deleteAllEvents() {
        regRepo.deleteAll();
        messageRepo.deleteAll();
        eventRepo.deleteAll();
    }
}