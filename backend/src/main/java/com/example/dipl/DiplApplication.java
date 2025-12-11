package com.example.dipl;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class DiplApplication {

    public static void main(String[] args) {
        SpringApplication.run(DiplApplication.class, args);
    }

    @Bean
    public CommandLineRunner initUsers(UserRepository userRepository) {
        return args -> {
            // Admin sicherstellen
            if (userRepository.findByUsername("admin").isEmpty()) {
                userRepository.save(new User("admin", "admin123", Role.ADMIN));
            }

            if (userRepository.findByUsername("lehrer1").isEmpty()) {
                userRepository.save(new User("lehrer1", "pass123", Role.TEACHER));
            }

            if (userRepository.findByUsername("schueler1").isEmpty()) {
                userRepository.save(new User("schueler1", "pass123", Role.STUDENT));
            }
        };
    }
}
