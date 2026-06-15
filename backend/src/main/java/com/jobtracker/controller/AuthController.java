package com.jobtracker.controller;

import com.jobtracker.dto.response.UserResponse;
import com.jobtracker.entity.User;
import com.jobtracker.repository.UserRepository;
import com.jobtracker.security.CustomOAuth2User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal CustomOAuth2User principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        return userRepository.findById(principal.getUserId())
                .map(u -> ResponseEntity.ok(new UserResponse(u.getId(), u.getEmail(), u.getName(), u.getPictureUrl())))
                .orElseGet(() -> ResponseEntity.status(401).build());
    }
}
