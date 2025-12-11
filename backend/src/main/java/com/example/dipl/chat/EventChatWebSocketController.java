package com.example.dipl.chat;

import com.example.dipl.user.User;
import com.example.dipl.user.UserRepository;
import com.example.dipl.event.Event;
import com.example.dipl.event.EventRepository;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Controller
public class EventChatWebSocketController {

    private final EventMessageRepository messageRepo;
    private final EventRepository eventRepo;
    private final UserRepository userRepo;
    private final SimpMessagingTemplate messagingTemplate;

    public EventChatWebSocketController(EventMessageRepository messageRepo,
                                        EventRepository eventRepo,
                                        UserRepository userRepo,
                                        SimpMessagingTemplate messagingTemplate) {
        this.messageRepo = messageRepo;
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
        this.messagingTemplate = messagingTemplate;
    }

    public static class ChatPayload {
        public Long eventId;
        public Long authorId;
        public String content;
    }

    @MessageMapping("/chat/{eventId}")
    public void handleChat(@DestinationVariable Long eventId, ChatPayload payload) {
        if (payload.content == null || payload.content.trim().isEmpty()) {
            return;
        }

        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event nicht gefunden"));

        User author = userRepo.findById(payload.authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User nicht gefunden"));

        EventMessage msg = new EventMessage();
        msg.setEvent(event);
        msg.setAuthor(author);
        msg.setContent(payload.content.trim());

        EventMessage saved = messageRepo.save(msg);

        messagingTemplate.convertAndSend("/topic/chat/" + eventId, saved);
    }
}
