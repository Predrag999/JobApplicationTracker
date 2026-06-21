package com.jobtracker.controller;

import com.jobtracker.entity.User;
import com.jobtracker.repository.UserRepository;
import com.jobtracker.support.WithMockCustomUser;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Autowired
    MockMvc mockMvc;

    // AuthController directly injects UserRepository, so we mock it here.
    @MockBean
    UserRepository userRepository;

    @Test
    @WithMockCustomUser
    void me_whenUserExistsInDatabase_returnsUserResponse() throws Exception {
        User user = buildUser(USER_ID, "test@example.com", "Test User", "https://example.com/pic.jpg");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(USER_ID.toString()))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.name").value("Test User"))
                .andExpect(jsonPath("$.pictureUrl").value("https://example.com/pic.jpg"));
    }

    @Test
    @WithMockCustomUser
    void me_whenUserMissingFromDatabase_returns401() throws Exception {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_unauthenticated_returns401() throws Exception {
        // /api/auth/** is permitAll so the request reaches the controller,
        // which checks principal == null and returns 401 explicitly.
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private User buildUser(UUID id, String email, String name, String pictureUrl) {
        User u = new User();
        u.setId(id);
        u.setGoogleId("google-" + id);
        u.setEmail(email);
        u.setName(name);
        u.setPictureUrl(pictureUrl);
        return u;
    }
}
