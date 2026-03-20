package com.example.dipl.payment;

import com.example.dipl.register.Registration;
import com.example.dipl.register.RegistrationRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:4200")
public class PaymentController {

    private final RegistrationRepository registrationRepository;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public PaymentController(RegistrationRepository registrationRepository) {
        this.registrationRepository = registrationRepository;
    }

    @PostMapping("/checkout/{registrationId}")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession(@PathVariable Long registrationId)
            throws StripeException {

        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Registrierung nicht gefunden"));

        if (registration.isPaid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Diese Registrierung ist bereits bezahlt");
        }

        Double eventPrice = registration.getEvent().getPrice();

        if (eventPrice == null || eventPrice <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dieses Event ist kostenlos");
        }

        long amountInCents = Math.round(eventPrice * 100);

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/payment-success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/payment-cancel")
                .putMetadata("registrationId", registration.getId().toString())
                .putMetadata("eventId", registration.getEvent().getId().toString())
                .putMetadata("studentId", registration.getStudent().getId().toString())
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("eur")
                                                .setUnitAmount(amountInCents)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName(registration.getEvent().getTitle())
                                                                .setDescription("Teilnahme am Event")
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .build();

        Session session = Session.create(params);

        registration.setStripeSessionId(session.getId());
        registrationRepository.save(registration);

        return ResponseEntity.ok(new CheckoutSessionResponse(session.getUrl()));
    }
}