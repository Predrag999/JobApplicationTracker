package com.jobtracker.controller;

import com.jobtracker.dto.request.CreateApplicationRequest;
import com.jobtracker.dto.request.UpdateApplicationRequest;
import com.jobtracker.dto.response.ApplicationResponse;
import com.jobtracker.dto.response.AutofillResponse;
import com.jobtracker.dto.response.PagedResponse;
import com.jobtracker.enums.ApplicationStatus;
import com.jobtracker.service.ApplicationService;
import com.jobtracker.service.ExportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "appliedDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return applicationService.findAll(status, search, page, size, sortBy, sortDir);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(@RequestParam(defaultValue = "csv") String format) {
        byte[] data = exportService.export(format);
        String ext = format.equals("xlsx") ? "xlsx" : "csv";
        String contentType = format.equals("xlsx")
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "text/csv; charset=UTF-8";
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"applications." + ext + "\"")
                .header("Content-Type", contentType)
                .body(data);
    }

    @GetMapping("/autofill")
    public AutofillResponse autofill(@RequestParam String url) {
        return applicationService.autofill(url);
    }

    @GetMapping("/{id}")
    public ApplicationResponse getOne(@PathVariable UUID id) {
        return applicationService.findById(id);
    }

    @PostMapping
    public ResponseEntity<ApplicationResponse> create(@Valid @RequestBody CreateApplicationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.create(req));
    }

    @PutMapping("/{id}")
    public ApplicationResponse update(@PathVariable UUID id,
                                       @Valid @RequestBody UpdateApplicationRequest req) {
        return applicationService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        applicationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
