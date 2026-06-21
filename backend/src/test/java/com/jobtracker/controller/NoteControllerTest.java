package com.jobtracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.dto.response.GeneratedNoteResponse;
import com.jobtracker.dto.response.NoteResponse;
import com.jobtracker.exception.ResourceNotFoundException;
import com.jobtracker.service.GenerateNoteService;
import com.jobtracker.service.NoteService;
import com.jobtracker.support.WithMockCustomUser;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class NoteControllerTest {

    static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    static final UUID APP_ID  = UUID.fromString("00000000-0000-0000-0000-000000000002");
    static final UUID NOTE_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean NoteService noteService;
    @MockBean GenerateNoteService generateNoteService;

    // ── security gate ─────────────────────────────────────────────────────────

    @Test
    void list_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/applications/{appId}/notes", APP_ID))
                .andExpect(status().isUnauthorized());
    }

    // ── list ──────────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void list_returnsNotesForApplication() throws Exception {
        List<NoteResponse> notes = List.of(
                new NoteResponse(NOTE_ID, "First interview went well", Instant.parse("2024-01-20T10:00:00Z")),
                new NoteResponse(UUID.randomUUID(), "Follow-up sent", Instant.parse("2024-01-21T09:00:00Z"))
        );
        when(noteService.findByApplicationId(APP_ID, USER_ID)).thenReturn(notes);

        mockMvc.perform(get("/api/applications/{appId}/notes", APP_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].content").value("First interview went well"))
                .andExpect(jsonPath("$[1].content").value("Follow-up sent"));
    }

    @Test
    @WithMockCustomUser
    void list_whenApplicationNotFound_returns404() throws Exception {
        when(noteService.findByApplicationId(APP_ID, USER_ID))
                .thenThrow(new ResourceNotFoundException("Application not found: " + APP_ID));

        mockMvc.perform(get("/api/applications/{appId}/notes", APP_ID))
                .andExpect(status().isNotFound());
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void create_withValidContent_returns201() throws Exception {
        NoteResponse created = new NoteResponse(NOTE_ID, "Great opportunity", Instant.now());
        when(noteService.create(eq(APP_ID), any(), eq(USER_ID))).thenReturn(created);

        mockMvc.perform(post("/api/applications/{appId}/notes", APP_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content": "Great opportunity"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(NOTE_ID.toString()))
                .andExpect(jsonPath("$.content").value("Great opportunity"));
    }

    @Test
    @WithMockCustomUser
    void create_withBlankContent_returns400() throws Exception {
        mockMvc.perform(post("/api/applications/{appId}/notes", APP_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content": "   "}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.content").exists());
    }

    @Test
    @WithMockCustomUser
    void create_withEmptyContent_returns400() throws Exception {
        mockMvc.perform(post("/api/applications/{appId}/notes", APP_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content": ""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.content").exists());
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void delete_returns204() throws Exception {
        doNothing().when(noteService).delete(APP_ID, NOTE_ID, USER_ID);

        mockMvc.perform(delete("/api/applications/{appId}/notes/{noteId}", APP_ID, NOTE_ID))
                .andExpect(status().isNoContent());

        verify(noteService).delete(APP_ID, NOTE_ID, USER_ID);
    }

    @Test
    @WithMockCustomUser
    void delete_whenNoteNotFound_returns404() throws Exception {
        doThrow(new ResourceNotFoundException("Note not found: " + NOTE_ID))
                .when(noteService).delete(APP_ID, NOTE_ID, USER_ID);

        mockMvc.perform(delete("/api/applications/{appId}/notes/{noteId}", APP_ID, NOTE_ID))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("Note not found")));
    }

    // ── AI generate ───────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void generate_returnsGeneratedNoteContent() throws Exception {
        String generated = "This is a senior backend engineer role at Acme Corp "
                + "requiring 5+ years of Java experience, with a focus on microservices.";
        when(generateNoteService.generate(APP_ID, USER_ID))
                .thenReturn(new GeneratedNoteResponse(generated));

        mockMvc.perform(post("/api/applications/{appId}/notes/generate", APP_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.generatedContent").value(generated));
    }
}
