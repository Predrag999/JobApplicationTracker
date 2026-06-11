package com.jobtracker.dto.response;

import java.time.Instant;
import java.util.UUID;

public record AttachmentResponse(
        UUID id,
        String originalFileName,
        String contentType,
        Long fileSizeBytes,
        Instant createdAt
) {}
