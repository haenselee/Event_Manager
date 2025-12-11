package com.example.dipl.chat;

import com.example.dipl.event.EventRepository;
import com.example.dipl.user.User;
import com.example.dipl.user.UserRepository;
import com.example.dipl.event.Event;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/event-messages")
@CrossOrigin(origins = "http://localhost:4200")
public class EventMessageController {

    private final EventMessageRepository messageRepo;
    private final EventRepository eventRepo;
    private final UserRepository userRepo;

    public EventMessageController(EventMessageRepository messageRepo,
                                  EventRepository eventRepo,
                                  UserRepository userRepo) {
        this.messageRepo = messageRepo;
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
    }

    @GetMapping
    public List<EventMessage> getMessages(@RequestParam Long eventId) {
        return messageRepo.findByEvent_IdOrderByCreatedAtAsc(eventId);
    }

    public static class CreateMessageRequest {
        public Long eventId;
        public Long authorId;
        public String content;
    }

    @PostMapping
    public EventMessage createMessage(@RequestBody CreateMessageRequest req) {
        if (req.content == null || req.content.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Inhalt darf nicht leer sein");
        }

        Event event = eventRepo.findById(req.eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event nicht gefunden"));

        User author = userRepo.findById(req.authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Benutzer nicht gefunden"));

        EventMessage msg = new EventMessage();
        msg.setEvent(event);
        msg.setAuthor(author);
        msg.setContent(req.content.trim());

        return messageRepo.save(msg);
    }
}
