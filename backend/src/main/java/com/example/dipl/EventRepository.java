package com.example.dipl;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
    // später: findByStartTimeAfter(LocalDateTime now) etc.
}
