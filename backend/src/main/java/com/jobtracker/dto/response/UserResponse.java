package com.jobtracker.dto.response;

import java.util.UUID;

public record UserResponse(UUID id, String email, String name, String pictureUrl) {}
