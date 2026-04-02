package com.example.dipl;

import com.example.dipl.event.Event;
import com.example.dipl.event.EventRepository;
import com.example.dipl.user.Role;
import com.example.dipl.user.User;
import com.example.dipl.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

@SpringBootApplication
public class DiplApplication {

    public static void main(String[] args) {
        SpringApplication.run(DiplApplication.class, args);
    }

    @Bean
    public CommandLineRunner initUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                userRepository.save(new User("admin", passwordEncoder.encode("admin123"), Role.ADMIN));
            }

            if (userRepository.findByUsername("lehrer1").isEmpty()) {
                userRepository.save(new User("lehrer1", passwordEncoder.encode("pass123"), Role.TEACHER));
            }

            if (userRepository.findByUsername("schueler1").isEmpty()) {
                userRepository.save(new User("schueler1", passwordEncoder.encode("pass123"), Role.STUDENT));
            }
            if (userRepository.findByUsername("schueler2").isEmpty()) {
                userRepository.save(new User("schueler2", passwordEncoder.encode("pass123"), Role.STUDENT));
            }
            if (userRepository.findByUsername("schueler3").isEmpty()) {
                userRepository.save(new User("schueler3", passwordEncoder.encode("pass123"), Role.STUDENT));
            }
            if (userRepository.findByUsername("schueler4").isEmpty()) {
                userRepository.save(new User("schueler4", passwordEncoder.encode("pass123"), Role.STUDENT));
            }


        };
    }
    @Bean
    CommandLineRunner initEvents(EventRepository eventRepo) {
        return args -> {

            createIfNotExists(eventRepo,
                    "Wien Exkursion",
                    "Besuch im Technischen Museum Wien",
                    "Wien",
                    LocalDate.now().plusDays(10),
                    15.0,
                    20
            );

            createIfNotExists(eventRepo,
                    "Sporttag",
                    "Fußballturnier und Leichtathletik",
                    "Schulsportplatz",
                    LocalDate.now().plusDays(5),
                    0.0,
                    30
            );

            createIfNotExists(eventRepo,
                    "Theaterbesuch",
                    "Gemeinsamer Besuch eines Theaterstücks",
                    "Stadttheater",
                    LocalDate.now().plusDays(20),
                    12.0,
                    25
            );

            createIfNotExists(eventRepo,
                    "IT Workshop",
                    "Einführung in Webentwicklung mit Angular",
                    "EDV Raum",
                    LocalDate.now().plusDays(3),
                    0.0,
                    15
            );

            createIfNotExists(eventRepo,
                    "Skikurs",
                    "3-tägiger Skikurs in den Alpen",
                    "Semmering",
                    LocalDate.now().plusDays(40),
                    120.0,
                    18
            );
        };
    }
    private void createIfNotExists(
            EventRepository repo,
            String title,
            String description,
            String location,
            LocalDate date,
            Double price,
            Integer maxParticipants
    ) {
        boolean exists = repo.findAll().stream()
                .anyMatch(e -> e.getTitle().equalsIgnoreCase(title));

        if (!exists) {
            Event e = new Event();
            e.setTitle(title);
            e.setDescription(description);
            e.setLocation(location);
            e.setDate(date);
            e.setPrice(price);
            e.setMaxParticipants(maxParticipants);

            repo.save(e);
        }
    }
}
