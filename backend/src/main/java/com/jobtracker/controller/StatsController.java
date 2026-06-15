package com.jobtracker.controller;

import com.jobtracker.dto.response.StatsResponse;
import com.jobtracker.security.CustomOAuth2User;
import com.jobtracker.service.StatsService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping
    public StatsResponse getStats(@AuthenticationPrincipal CustomOAuth2User principal) {
        return statsService.getStats(principal.getUserId());
    }
}
