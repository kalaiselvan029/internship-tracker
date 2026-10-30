
package com.kalai.internship_tracker.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.kalai.internship_tracker.service.JwtService;
import com.kalai.internship_tracker.dto.AuthResponse;
import com.kalai.internship_tracker.dto.RegisterRequest;
import com.kalai.internship_tracker.entity.AppUser;
import com.kalai.internship_tracker.repository.AppUserRepository;
import com.kalai.internship_tracker.exception.EmailAlreadyExistsException;
import com.kalai.internship_tracker.dto.LoginRequest;
@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    public AuthService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {



        if (appUserRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(
                    "Email is already registered");
        }



        AppUser user = new AppUser();

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(
                passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");

        AppUser savedUser = appUserRepository.save(user);

        return new AuthResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                "Registration successful"
        );
    }


    public AuthResponse login(LoginRequest request) {

        AppUser user = appUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("Invalid email or password"));

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        );

        if (!passwordMatches) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);

        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                "Login successful",
                token
        );
    }

}
