package com.jobtracker.controller;

import com.jobtracker.dto.request.CreateApplicationRequest;
import com.jobtracker.dto.request.UpdateApplicationRequest;
import com.jobtracker.dto.response.ApplicationResponse;
import com.jobtracker.dto.response.AutofillResponse;
import com.jobtracker.dto.response.PagedResponse;
import com.jobtracker.enums.ApplicationStatus;
import com.jobtracker.security.CustomOAuth2User;
import com.jobtracker.service.ApplicationService;
import com.jobtracker.service.ExportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final ExportService exportService;

    public ApplicationController(ApplicationService applicationService, ExportService exportService) {
        this.applicationService = applicationService;
        this.exportService = exportService;
    }

    @GetMapping
    public PagedResponse<ApplicationResponse> list(
            @AuthenticationPrincipal CustomOAuth2User principal,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "appliedDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return applicationService.findAll(principal.getUserId(), status, search, page, size, sortBy, sortDir);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            @AuthenticationPrincipal CustomOAuth2User principal,
            @RequestParam(defaultValue = "csv") String format) {
        byte[] data = exportService.export(format, principal.getUserId());
        String ext = format.equals("xlsx") ? "xlsx" : "csv";
        String contentType = format.equals("xlsx")
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "text/csv; charset=UTF-8";
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"applications." + ext + "\"")
                .header("Content-Type", contentType)
                .body(data);
    }

    @GetMapping("/deadline/tomorrow")
    public List<ApplicationResponse> deadlineTomorrow(
            @AuthenticationPrincipal CustomOAuth2User principal) {
        return applicationService.findDeadlineTomorrow(principal.getUserId());
    }

    @GetMapping("/autofill")
    public AutofillResponse autofill(@RequestParam String url) {
        return applicationService.autofill(url);
    }

    @GetMapping("/{id}")
    public ApplicationResponse getOne(
            @AuthenticationPrincipal CustomOAuth2User principal,
            @PathVariable UUID id) {
        return applicationService.findById(id, principal.getUserId());
    }

    @PostMapping
    public ResponseEntity<ApplicationResponse> create(
            @AuthenticationPrincipal CustomOAuth2User principal,
            @Valid @RequestBody CreateApplicationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.create(req, principal.getUserId()));
    }

    @PutMapping("/{id}")
    public ApplicationResponse update(
            @AuthenticationPrincipal CustomOAuth2User principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateApplicationRequest req) {
        return applicationService.update(id, req, principal.getUserId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal CustomOAuth2User principal,
            @PathVariable UUID id) {
        applicationService.delete(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}
