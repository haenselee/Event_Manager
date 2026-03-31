package com.example.dipl;

import com.example.dipl.chat.EventMessageRepository;
import com.example.dipl.event.Event;
import com.example.dipl.event.EventController;
import com.example.dipl.event.EventRepository;
import com.example.dipl.register.RegistrationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventControllerTest {

    @Mock
    private EventMessageRepository messageRepo;

    @Mock
    private EventRepository eventRepo;

    @Mock
    private RegistrationRepository regRepo;

    @InjectMocks
    private EventController eventController;

    @Test
    void updateEvent_shouldRejectPriceChange_whenPaidRegistrationsExist() {
        Event existing = new Event();
        existing.setId(4L);
        existing.setTitle("Workshop");
        existing.setPrice(10.0);
        existing.setMaxParticipants(30);

        Event updated = new Event();
        updated.setTitle("Workshop neu");
        updated.setPrice(25.0);
        updated.setMaxParticipants(30);

        when(eventRepo.findById(4L)).thenReturn(Optional.of(existing));
        when(regRepo.existsByEvent_IdAndPaidTrue(4L)).thenReturn(true);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> eventController.updateEvent(4L, updated)
        );

        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("Preis"));
        verify(eventRepo, never()).save(any());
    }
}