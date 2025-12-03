// Registration.java
package com.example.dipl;

import jakarta.persistence.*;

@Entity
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long eventId;
    private Long studentId;    // später als @ManyToOne(User)

    @Enumerated(EnumType.STRING)
    private RegistrationStatus status;
}

enum RegistrationStatus {
    REGISTERED,
    CANCELLED
}
