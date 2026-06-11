package com.jobtracker.service;

import com.jobtracker.dto.response.StatsResponse;
import com.jobtracker.enums.ApplicationStatus;
import com.jobtracker.repository.ApplicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class StatsService {

    private final ApplicationRepository applicationRepository;

    public StatsService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    public StatsResponse getStats() {
        Map<String, Long> byStatus = Arrays.stream(ApplicationStatus.values())
                .collect(Collectors.toMap(Enum::name, applicationRepository::countByStatus));

        long total = byStatus.values().stream().mapToLong(Long::longValue).sum();
        long rejectedCount = byStatus.getOrDefault(ApplicationStatus.REJECTED.name(), 0L);
        long withdrawnCount = byStatus.getOrDefault(ApplicationStatus.WITHDRAWN.name(), 0L);
        long offerCount = byStatus.getOrDefault(ApplicationStatus.OFFER.name(), 0L);
        long activeCount = total - rejectedCount - withdrawnCount;

        return new StatsResponse(total, byStatus, activeCount, offerCount, rejectedCount);
    }
}
