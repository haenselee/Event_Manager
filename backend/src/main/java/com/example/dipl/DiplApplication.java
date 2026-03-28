package com.example.dipl;

import com.example.dipl.user.Role;
import com.example.dipl.user.User;
import com.example.dipl.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

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
        };
    }
}
