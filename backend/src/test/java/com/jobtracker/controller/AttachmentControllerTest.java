package com.jobtracker.controller;

import com.jobtracker.dto.response.AttachmentResponse;
import com.jobtracker.entity.Attachment;
import com.jobtracker.exception.ResourceNotFoundException;
import com.jobtracker.service.AttachmentService;
import com.jobtracker.support.WithMockCustomUser;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AttachmentControllerTest {

    static final UUID USER_ID       = UUID.fromString("00000000-0000-0000-0000-000000000001");
    static final UUID APP_ID        = UUID.fromString("00000000-0000-0000-0000-000000000002");
    static final UUID ATTACHMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000004");

    @Autowired MockMvc mockMvc;
    @MockBean AttachmentService attachmentService;

    // ── security gate ─────────────────────────────────────────────────────────

    @Test
    void list_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/applications/{appId}/attachments", APP_ID))
                .andExpect(status().isUnauthorized());
    }

    // ── list ──────────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void list_returnsAttachmentsForApplication() throws Exception {
        List<AttachmentResponse> attachments = List.of(
                new AttachmentResponse(ATTACHMENT_ID, "resume.pdf", "application/pdf",
                        102400L, Instant.parse("2024-01-15T10:00:00Z")),
                new AttachmentResponse(UUID.randomUUID(), "cover-letter.docx",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        51200L, Instant.parse("2024-01-16T10:00:00Z"))
        );
        when(attachmentService.findByApplicationId(APP_ID, USER_ID)).thenReturn(attachments);

        mockMvc.perform(get("/api/applications/{appId}/attachments", APP_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].originalFileName").value("resume.pdf"))
                .andExpect(jsonPath("$[0].contentType").value("application/pdf"))
                .andExpect(jsonPath("$[1].originalFileName").value("cover-letter.docx"));
    }

    @Test
    @WithMockCustomUser
    void list_whenApplicationNotFound_returns404() throws Exception {
        when(attachmentService.findByApplicationId(APP_ID, USER_ID))
                .thenThrow(new ResourceNotFoundException("Application not found: " + APP_ID));

        mockMvc.perform(get("/api/applications/{appId}/attachments", APP_ID))
                .andExpect(status().isNotFound());
    }

    // ── upload ────────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void upload_returnsCreatedAttachmentMetadata() throws Exception {
        AttachmentResponse created = new AttachmentResponse(
                ATTACHMENT_ID, "resume.pdf", "application/pdf", 102400L, Instant.now());
        when(attachmentService.upload(eq(APP_ID), eq(USER_ID), any()))
                .thenReturn(created);

        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf",
                "PDF content".getBytes());

        mockMvc.perform(multipart("/api/applications/{appId}/attachments", APP_ID).file(file))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(ATTACHMENT_ID.toString()))
                .andExpect(jsonPath("$.originalFileName").value("resume.pdf"))
                .andExpect(jsonPath("$.contentType").value("application/pdf"))
                .andExpect(jsonPath("$.fileSizeBytes").value(102400));
    }

    @Test
    @WithMockCustomUser
    void upload_whenApplicationForbidden_returns403() throws Exception {
        when(attachmentService.upload(eq(APP_ID), eq(USER_ID), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "content".getBytes());

        mockMvc.perform(multipart("/api/applications/{appId}/attachments", APP_ID).file(file))
                .andExpect(status().isForbidden());
    }

    // ── download ──────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void download_returnsFileWithContentDispositionHeader() throws Exception {
        Attachment attachment = buildAttachment(ATTACHMENT_ID, "resume.pdf", "application/pdf");
        ByteArrayResource resource = new ByteArrayResource("PDF content".getBytes());

        when(attachmentService.getOrThrow(ATTACHMENT_ID)).thenReturn(attachment);
        when(attachmentService.download(ATTACHMENT_ID, USER_ID)).thenReturn(resource);

        mockMvc.perform(get("/api/attachments/{attachmentId}/download", ATTACHMENT_ID))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        containsString("filename=\"resume.pdf\"")))
                .andExpect(content().contentType("application/pdf"));
    }

    @Test
    @WithMockCustomUser
    void download_whenAttachmentNotFound_returns404() throws Exception {
        when(attachmentService.getOrThrow(ATTACHMENT_ID))
                .thenThrow(new ResourceNotFoundException("Attachment not found: " + ATTACHMENT_ID));

        mockMvc.perform(get("/api/attachments/{attachmentId}/download", ATTACHMENT_ID))
                .andExpect(status().isNotFound());
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void delete_returns204() throws Exception {
        doNothing().when(attachmentService).delete(ATTACHMENT_ID, USER_ID);

        mockMvc.perform(delete("/api/attachments/{attachmentId}", ATTACHMENT_ID))
                .andExpect(status().isNoContent());

        verify(attachmentService).delete(ATTACHMENT_ID, USER_ID);
    }

    @Test
    @WithMockCustomUser
    void delete_whenAttachmentNotFound_returns404() throws Exception {
        doThrow(new ResourceNotFoundException("Attachment not found: " + ATTACHMENT_ID))
                .when(attachmentService).delete(ATTACHMENT_ID, USER_ID);

        mockMvc.perform(delete("/api/attachments/{attachmentId}", ATTACHMENT_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockCustomUser
    void delete_whenForbidden_returns403() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"))
                .when(attachmentService).delete(ATTACHMENT_ID, USER_ID);

        mockMvc.perform(delete("/api/attachments/{attachmentId}", ATTACHMENT_ID))
                .andExpect(status().isForbidden());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Attachment buildAttachment(UUID id, String originalFileName, String contentType) {
        Attachment a = new Attachment();
        a.setId(id);
        a.setOriginalFileName(originalFileName);
        a.setStoredFileName(UUID.randomUUID() + "_" + originalFileName);
        a.setContentType(contentType);
        a.setFileSizeBytes(102400L);
        return a;
    }
}
