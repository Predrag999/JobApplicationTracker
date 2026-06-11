package com.jobtracker.controller;

import com.jobtracker.dto.response.AttachmentResponse;
import com.jobtracker.entity.Attachment;
import com.jobtracker.service.AttachmentService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @GetMapping("/api/applications/{applicationId}/attachments")
    public List<AttachmentResponse> list(@PathVariable UUID applicationId) {
        return attachmentService.findByApplicationId(applicationId);
    }

    @PostMapping("/api/applications/{applicationId}/attachments")
    public ResponseEntity<AttachmentResponse> upload(@PathVariable UUID applicationId,
                                                      @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED).body(attachmentService.upload(applicationId, file));
    }

    @GetMapping("/api/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID attachmentId) throws IOException {
        Attachment attachment = attachmentService.getOrThrow(attachmentId);
        Resource resource = attachmentService.download(attachmentId);
        String contentType = attachment.getContentType() != null
                ? attachment.getContentType()
                : "application/octet-stream";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + attachment.getOriginalFileName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/api/attachments/{attachmentId}")
    public ResponseEntity<Void> delete(@PathVariable UUID attachmentId) throws IOException {
        attachmentService.delete(attachmentId);
        return ResponseEntity.noContent().build();
    }
}
