package com.example.dipl.payment;

import com.example.dipl.register.Registration;
import com.example.dipl.register.RegistrationRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class StripeWebhookController {

    private final RegistrationRepository registrationRepository;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    public StripeWebhookController(RegistrationRepository registrationRepository) {
        this.registrationRepository = registrationRepository;
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;

        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            return ResponseEntity.badRequest().body("Ungültige Signatur");
        }

        if ("checkout.session.completed".equals(event.getType())) {
            Optional<StripeObject> stripeObject = event.getDataObjectDeserializer().getObject();

            if (stripeObject.isPresent() && stripeObject.get() instanceof Session session) {
                String registrationIdString = session.getMetadata().get("registrationId");

                if (registrationIdString != null) {
                    Long registrationId = Long.parseLong(registrationIdString);

                    Registration registration = registrationRepository.findById(registrationId)
                            .orElseThrow(() -> new RuntimeException("Registrierung nicht gefunden"));

                    registration.setPaid(true);
                    registration.setPaymentCompletedAt(LocalDateTime.now());

                    if (session.getPaymentIntent() != null) {
                        registration.setStripePaymentIntentId(session.getPaymentIntent());
                    }

                    if (registration.getStripeSessionId() == null) {
                        registration.setStripeSessionId(session.getId());
                    }

                    registrationRepository.save(registration);
                }
            }
        }

        return ResponseEntity.ok("ok");
    }
}