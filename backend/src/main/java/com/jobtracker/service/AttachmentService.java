package com.jobtracker.service;

import com.jobtracker.config.FileStorageConfig;
import com.jobtracker.dto.response.AttachmentResponse;
import com.jobtracker.entity.Attachment;
import com.jobtracker.entity.JobApplication;
import com.jobtracker.exception.ResourceNotFoundException;
import com.jobtracker.repository.AttachmentRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final ApplicationService applicationService;
    private final FileStorageConfig fileStorageConfig;

    public AttachmentService(AttachmentRepository attachmentRepository,
                              ApplicationService applicationService,
                              FileStorageConfig fileStorageConfig) {
        this.attachmentRepository = attachmentRepository;
        this.applicationService = applicationService;
        this.fileStorageConfig = fileStorageConfig;
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> findByApplicationId(UUID applicationId, UUID userId) {
        applicationService.getOrThrow(applicationId, userId);
        return attachmentRepository.findByJobApplicationIdOrderByCreatedAtDesc(applicationId)
                .stream().map(this::toResponse).toList();
    }

    public AttachmentResponse upload(UUID applicationId, UUID userId, MultipartFile file) throws IOException {
        String storedFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path targetPath = fileStorageConfig.getUploadPath().resolve(storedFileName);
        Files.copy(file.getInputStream(), targetPath);

        Attachment attachment = new Attachment();
        attachment.setJobApplication(applicationService.getOrThrow(applicationId, userId));
        attachment.setOriginalFileName(file.getOriginalFilename());
        attachment.setStoredFileName(storedFileName);
        attachment.setContentType(file.getContentType());
        attachment.setFileSizeBytes(file.getSize());
        return toResponse(attachmentRepository.save(attachment));
    }

    @Transactional(readOnly = true)
    public Attachment getOrThrow(UUID attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found: " + attachmentId));
    }

    @Transactional(readOnly = true)
    public Resource download(UUID attachmentId, UUID userId) throws IOException {
        Attachment attachment = getOrThrow(attachmentId);
        verifyOwnership(attachment, userId);
        Path filePath = fileStorageConfig.getUploadPath().resolve(attachment.getStoredFileName());
        return new UrlResource(filePath.toUri());
    }

    public void delete(UUID attachmentId, UUID userId) throws IOException {
        Attachment attachment = getOrThrow(attachmentId);
        verifyOwnership(attachment, userId);
        Path filePath = fileStorageConfig.getUploadPath().resolve(attachment.getStoredFileName());
        Files.deleteIfExists(filePath);
        attachmentRepository.delete(attachment);
    }

    private void verifyOwnership(Attachment attachment, UUID userId) {
        JobApplication app = attachment.getJobApplication();
        if (app == null || app.getUser() == null || !app.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    private AttachmentResponse toResponse(Attachment a) {
        return new AttachmentResponse(
                a.getId(), a.getOriginalFileName(), a.getContentType(),
                a.getFileSizeBytes(), a.getCreatedAt()
        );
    }
}
