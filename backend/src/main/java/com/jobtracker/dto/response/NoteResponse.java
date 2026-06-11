package com.jobtracker.dto.response;

import java.time.Instant;
import java.util.UUID;

public record NoteResponse(UUID id, String content, Instant createdAt) {}
