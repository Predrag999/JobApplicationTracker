package com.jobtracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.dto.request.CreateApplicationRequest;
import com.jobtracker.dto.request.UpdateApplicationRequest;
import com.jobtracker.dto.response.ApplicationResponse;
import com.jobtracker.dto.response.AutofillResponse;
import com.jobtracker.dto.response.PagedResponse;
import com.jobtracker.enums.ApplicationStatus;
import com.jobtracker.exception.ResourceNotFoundException;
import com.jobtracker.service.ApplicationService;
import com.jobtracker.service.ExportService;
import com.jobtracker.support.WithMockCustomUser;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ApplicationControllerTest {

    static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    static final UUID APP_ID  = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean ApplicationService applicationService;
    @MockBean ExportService exportService;

    // ── security gate ─────────────────────────────────────────────────────────

    @Test
    void list_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/applications"))
                .andExpect(status().isUnauthorized());
    }

    // ── list ──────────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void list_returnsPagedResponse() throws Exception {
        PagedResponse<ApplicationResponse> page = new PagedResponse<>(
                List.of(sampleResponse()), 0, 20, 1L, 1, true);
        when(applicationService.findAll(eq(USER_ID), isNull(), isNull(),
                eq(0), eq(20), eq("appliedDate"), eq("desc")))
                .thenReturn(page);

        mockMvc.perform(get("/api/applications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].companyName").value("Acme Corp"))
                .andExpect(jsonPath("$.content[0].status").value("APPLIED"));
    }

    @Test
    @WithMockCustomUser
    void list_withStatusAndSearchFilters_passesThemToService() throws Exception {
        PagedResponse<ApplicationResponse> empty = new PagedResponse<>(List.of(), 0, 10, 0L, 0, true);
        when(applicationService.findAll(eq(USER_ID),
                eq(ApplicationStatus.INTERVIEW), eq("Google"), eq(0), eq(10), anyString(), anyString()))
                .thenReturn(empty);

        mockMvc.perform(get("/api/applications")
                        .param("status", "INTERVIEW")
                        .param("search", "Google")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content", hasSize(0)));
    }

    // ── getOne ────────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void getOne_returnsApplication() throws Exception {
        when(applicationService.findById(APP_ID, USER_ID)).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/applications/{id}", APP_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(APP_ID.toString()))
                .andExpect(jsonPath("$.companyName").value("Acme Corp"))
                .andExpect(jsonPath("$.jobTitle").value("Software Engineer"));
    }

    @Test
    @WithMockCustomUser
    void getOne_notFound_returns404() throws Exception {
        when(applicationService.findById(APP_ID, USER_ID))
                .thenThrow(new ResourceNotFoundException("Application not found: " + APP_ID));

        mockMvc.perform(get("/api/applications/{id}", APP_ID))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("Application not found")));
    }

    @Test
    @WithMockCustomUser
    void getOne_belongsToAnotherUser_returns403() throws Exception {
        when(applicationService.findById(APP_ID, USER_ID))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

        mockMvc.perform(get("/api/applications/{id}", APP_ID))
                .andExpect(status().isForbidden());
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void create_withValidRequest_returns201() throws Exception {
        CreateApplicationRequest req = new CreateApplicationRequest(
                "Acme Corp", "Software Engineer", "https://example.com/job",
                ApplicationStatus.APPLIED, LocalDate.of(2024, 1, 15), null);
        when(applicationService.create(any(CreateApplicationRequest.class), eq(USER_ID)))
                .thenReturn(sampleResponse());

        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.companyName").value("Acme Corp"));
    }

    @Test
    @WithMockCustomUser
    void create_withBlankCompanyName_returns400() throws Exception {
        String body = """
                {"companyName":"","jobTitle":"Engineer","status":"APPLIED","appliedDate":"2024-01-15"}
                """;

        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.companyName").exists());
    }

    @Test
    @WithMockCustomUser
    void create_withBlankJobTitle_returns400() throws Exception {
        String body = """
                {"companyName":"Acme","jobTitle":"","status":"APPLIED","appliedDate":"2024-01-15"}
                """;

        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.jobTitle").exists());
    }

    @Test
    @WithMockCustomUser
    void create_withNullStatus_returns400() throws Exception {
        String body = """
                {"companyName":"Acme","jobTitle":"Engineer","appliedDate":"2024-01-15"}
                """;

        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.status").exists());
    }

    @Test
    @WithMockCustomUser
    void create_withNullAppliedDate_returns400() throws Exception {
        String body = """
                {"companyName":"Acme","jobTitle":"Engineer","status":"APPLIED"}
                """;

        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.appliedDate").exists());
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void update_withValidRequest_returns200() throws Exception {
        UpdateApplicationRequest req = new UpdateApplicationRequest(
                "Acme Corp", "Senior Engineer", null,
                ApplicationStatus.INTERVIEW, LocalDate.of(2024, 1, 15), null);
        ApplicationResponse updated = new ApplicationResponse(
                APP_ID, "Acme Corp", "Senior Engineer", null,
                ApplicationStatus.INTERVIEW, LocalDate.of(2024, 1, 15), null,
                Instant.now(), Instant.now(), 0, 0);
        when(applicationService.update(eq(APP_ID), any(UpdateApplicationRequest.class), eq(USER_ID)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/applications/{id}", APP_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobTitle").value("Senior Engineer"))
                .andExpect(jsonPath("$.status").value("INTERVIEW"));
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void delete_returns204() throws Exception {
        doNothing().when(applicationService).delete(APP_ID, USER_ID);

        mockMvc.perform(delete("/api/applications/{id}", APP_ID))
                .andExpect(status().isNoContent());

        verify(applicationService).delete(APP_ID, USER_ID);
    }

    @Test
    @WithMockCustomUser
    void delete_notFound_returns404() throws Exception {
        doThrow(new ResourceNotFoundException("Application not found: " + APP_ID))
                .when(applicationService).delete(APP_ID, USER_ID);

        mockMvc.perform(delete("/api/applications/{id}", APP_ID))
                .andExpect(status().isNotFound());
    }

    // ── export ────────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void export_csv_returns200WithAttachmentHeader() throws Exception {
        byte[] csvData = "Company,Job Title\nAcme,Engineer\n".getBytes();
        when(exportService.export("csv", USER_ID)).thenReturn(csvData);

        mockMvc.perform(get("/api/applications/export").param("format", "csv"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        containsString("filename=\"applications.csv\"")))
                .andExpect(content().contentTypeCompatibleWith("text/csv"));
    }

    @Test
    @WithMockCustomUser
    void export_xlsx_returns200WithCorrectContentType() throws Exception {
        byte[] xlsxData = new byte[]{0x50, 0x4B};
        when(exportService.export("xlsx", USER_ID)).thenReturn(xlsxData);

        mockMvc.perform(get("/api/applications/export").param("format", "xlsx"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        containsString("filename=\"applications.xlsx\"")))
                .andExpect(header().string("Content-Type",
                        containsString("spreadsheetml.sheet")));
    }

    @Test
    @WithMockCustomUser
    void export_invalidFormat_returns400() throws Exception {
        when(exportService.export(eq("pdf"), eq(USER_ID)))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Unsupported format 'pdf'. Use 'csv' or 'xlsx'."));

        mockMvc.perform(get("/api/applications/export").param("format", "pdf"))
                .andExpect(status().isBadRequest());
    }

    // ── autofill ──────────────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void autofill_returnsExtractedCompanyAndTitle() throws Exception {
        String jobUrl = "https://example.com/jobs/123";
        AutofillResponse autofill = new AutofillResponse("Acme Corp", "Software Engineer", jobUrl);
        when(applicationService.autofill(jobUrl)).thenReturn(autofill);

        mockMvc.perform(get("/api/applications/autofill").param("url", jobUrl))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("Acme Corp"))
                .andExpect(jsonPath("$.jobTitle").value("Software Engineer"))
                .andExpect(jsonPath("$.jobUrl").value(jobUrl));
    }

    @Test
    @WithMockCustomUser
    void autofill_whenBotProtected_returns422() throws Exception {
        String jobUrl = "https://protected-site.com/job";
        when(applicationService.autofill(jobUrl))
                .thenThrow(new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "This site uses bot protection that prevents automated data extraction."));

        mockMvc.perform(get("/api/applications/autofill").param("url", jobUrl))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── deadline/tomorrow ─────────────────────────────────────────────────────

    @Test
    @WithMockCustomUser
    void deadlineTomorrow_returnsListOfDueApplications() throws Exception {
        when(applicationService.findDeadlineTomorrow(USER_ID))
                .thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/applications/deadline/tomorrow"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].companyName").value("Acme Corp"));
    }

    @Test
    @WithMockCustomUser
    void deadlineTomorrow_whenNoDeadlines_returnsEmptyList() throws Exception {
        when(applicationService.findDeadlineTomorrow(USER_ID)).thenReturn(List.of());

        mockMvc.perform(get("/api/applications/deadline/tomorrow"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private ApplicationResponse sampleResponse() {
        return new ApplicationResponse(
                APP_ID,
                "Acme Corp",
                "Software Engineer",
                "https://example.com/job",
                ApplicationStatus.APPLIED,
                LocalDate.of(2024, 1, 15),
                null,
                Instant.parse("2024-01-15T10:00:00Z"),
                Instant.parse("2024-01-15T10:00:00Z"),
                0,
                0
        );
    }
}
