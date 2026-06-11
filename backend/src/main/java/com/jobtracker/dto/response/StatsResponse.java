package com.jobtracker.dto.response;

import java.util.Map;

public record StatsResponse(
        long total,
        Map<String, Long> byStatus,
        long activeCount,
        long offerCount,
        long rejectedCount
) {}
