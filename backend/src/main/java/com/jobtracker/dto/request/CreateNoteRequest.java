package com.jobtracker.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateNoteRequest(@NotBlank String content) {}
