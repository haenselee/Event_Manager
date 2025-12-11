package com.example.dipl;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    List<Registration> findByStudent_Id(Long studentId);

    boolean existsByStudent_IdAndEvent_Id(Long studentId, Long eventId);

    List<Registration> findByStudent_IdAndEvent_Id(Long studentId, Long eventId);

    List<Registration> findByEvent_Id(Long eventId);

    Registration findFirstByStudent_IdAndEvent_Id(Long studentId, Long eventId);
}
