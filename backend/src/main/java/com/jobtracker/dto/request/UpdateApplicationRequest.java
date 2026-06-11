package com.jobtracker.dto.request;

import com.jobtracker.enums.ApplicationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record UpdateApplicationRequest(
        @NotBlank String companyName,
        @NotBlank String jobTitle,
        String jobUrl,
        @NotNull ApplicationStatus status,
        @NotNull LocalDate appliedDate,
        LocalDate deadlineDate
) {}
