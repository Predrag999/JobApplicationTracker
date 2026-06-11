package com.jobtracker.dto.response;

import com.jobtracker.enums.ApplicationStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ApplicationResponse(
        UUID id,
        String companyName,
        String jobTitle,
        String jobUrl,
        ApplicationStatus status,
        LocalDate appliedDate,
        LocalDate deadlineDate,
        Instant createdAt,
        Instant updatedAt,
        int noteCount,
        int attachmentCount
) {}
