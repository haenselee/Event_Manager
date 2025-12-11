package com.example.dipl;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventMessageRepository extends JpaRepository<EventMessage, Long> {

    List<EventMessage> findByEvent_IdOrderByCreatedAtAsc(Long eventId);
}
