package com.jobtracker.controller;

import com.jobtracker.dto.response.StatsResponse;
import com.jobtracker.service.StatsService;
import com.jobtracker.support.WithMockCustomUser;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class StatsControllerTest {

    static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Autowired MockMvc mockMvc;
    @MockBean StatsService statsService;

    // ── security gate ─────────────────────────────────────────────────────────

    @Test
    void getStats_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isUnauthorized());
    }

    // ── getStats ──────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void getStats_returnsAggregatedCounts() throws Exception {
        Map<String, Long> byStatus = Map.of(
                "APPLIED",        3L,
                "PHONE_SCREEN",   1L,
                "INTERVIEW",      2L,
                "TECHNICAL_TEST", 0L,
                "OFFER",          1L,
                "REJECTED",       1L,
                "WITHDRAWN",      0L
        );
        StatsResponse stats = new StatsResponse(8L, byStatus, 7L, 1L, 1L);
        when(statsService.getStats(USER_ID)).thenReturn(stats);

        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(8))
                .andExpect(jsonPath("$.activeCount").value(7))
                .andExpect(jsonPath("$.offerCount").value(1))
                .andExpect(jsonPath("$.rejectedCount").value(1))
                .andExpect(jsonPath("$.byStatus.APPLIED").value(3))
                .andExpect(jsonPath("$.byStatus.INTERVIEW").value(2));
    }

    @Test
    @WithMockCustomUser
    void getStats_whenNoApplications_returnsZeroCounts() throws Exception {
        Map<String, Long> emptyByStatus = Map.of(
                "APPLIED", 0L, "PHONE_SCREEN", 0L, "INTERVIEW", 0L,
                "TECHNICAL_TEST", 0L, "OFFER", 0L, "REJECTED", 0L, "WITHDRAWN", 0L
        );
        when(statsService.getStats(USER_ID))
                .thenReturn(new StatsResponse(0L, emptyByStatus, 0L, 0L, 0L));

        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.activeCount").value(0));
    }
}
