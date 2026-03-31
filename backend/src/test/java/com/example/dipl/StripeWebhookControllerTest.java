package com.example.dipl;

import com.example.dipl.event.Event;
import com.example.dipl.payment.StripeWebhookController;
import com.example.dipl.register.Registration;
import com.example.dipl.register.RegistrationRepository;
import com.example.dipl.user.Role;
import com.example.dipl.user.User;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StripeWebhookControllerTest {

    @Mock
    private RegistrationRepository registrationRepository;

    @InjectMocks
    private StripeWebhookController stripeWebhookController;

    @Test
    void handleWebhook_shouldMarkRegistrationAsPaid_whenCheckoutSessionCompleted() throws Exception {
        // webhook secret setzen
        ReflectionTestUtils.setField(stripeWebhookController, "webhookSecret", "whsec_test");

        // Test-Registrierung vorbereiten
        User student = new User("max", "pw", Role.STUDENT);
        student.setId(1L);

        Event eventEntity = new Event();
        eventEntity.setId(10L);
        eventEntity.setTitle("Java Workshop");
        eventEntity.setPrice(49.99);

        Registration registration = new Registration();
        registration.setStudent(student);
        registration.setEvent(eventEntity);
        registration.setPaid(false);
        registration.setStripeSessionId(null);
        registration.setStripePaymentIntentId(null);
        registration.setPaymentCompletedAt(null);

        // ID per Reflection setzen, weil Entity keine setId()-Methode hat
        ReflectionTestUtils.setField(registration, "id", 5L);

        when(registrationRepository.findById(5L)).thenReturn(Optional.of(registration));

        // Stripe Session mocken
        Session session = mock(Session.class);
        Map<String, String> metadata = new HashMap<>();
        metadata.put("registrationId", "5");

        when(session.getMetadata()).thenReturn(metadata);
        when(session.getPaymentIntent()).thenReturn("pi_test_123");
        when(session.getId()).thenReturn("cs_test_123");

        // Stripe Event + Deserializer mocken
        com.stripe.model.Event stripeEvent = mock(com.stripe.model.Event.class);
        EventDataObjectDeserializer deserializer = mock(EventDataObjectDeserializer.class);

        when(stripeEvent.getType()).thenReturn("checkout.session.completed");
        when(stripeEvent.getDataObjectDeserializer()).thenReturn(deserializer);
        when(deserializer.getObject()).thenReturn(Optional.of((StripeObject) session));

        // statische Stripe-Methode mocken
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent("payload", "sig", "whsec_test"))
                    .thenReturn(stripeEvent);

            ResponseEntity<String> response =
                    stripeWebhookController.handleWebhook("payload", "sig");

            assertEquals(200, response.getStatusCode().value());
            assertEquals("ok", response.getBody());
        }

        ArgumentCaptor<Registration> captor = ArgumentCaptor.forClass(Registration.class);
        verify(registrationRepository).save(captor.capture());

        Registration saved = captor.getValue();

        assertTrue(saved.isPaid());
        assertEquals("pi_test_123", saved.getStripePaymentIntentId());
        assertEquals("cs_test_123", saved.getStripeSessionId());
        assertNotNull(saved.getPaymentCompletedAt());
    }
}