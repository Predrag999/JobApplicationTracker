package com.jobtracker.service;

import com.jobtracker.dto.request.CreateApplicationRequest;
import com.jobtracker.dto.request.UpdateApplicationRequest;
import com.jobtracker.dto.response.ApplicationResponse;
import com.jobtracker.dto.response.PagedResponse;
import com.jobtracker.entity.JobApplication;
import com.jobtracker.enums.ApplicationStatus;
import com.jobtracker.exception.ResourceNotFoundException;
import com.jobtracker.repository.ApplicationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class ApplicationService {

    private final ApplicationRepository applicationRepository;

    public ApplicationService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ApplicationResponse> findAll(
            ApplicationStatus status, String search,
            int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Page<JobApplication> result = applicationRepository.findAllFiltered(
                status, search, PageRequest.of(page, size, sort));
        return new PagedResponse<>(
                result.getContent().stream().map(this::toResponse).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast()
        );
    }

    @Transactional(readOnly = true)
    public ApplicationResponse findById(UUID id) {
        return toResponse(getOrThrow(id));
    }

    public ApplicationResponse create(CreateApplicationRequest req) {
        JobApplication app = new JobApplication();
        app.setCompanyName(req.companyName());
        app.setJobTitle(req.jobTitle());
        app.setJobUrl(req.jobUrl());
        app.setStatus(req.status());
        app.setAppliedDate(req.appliedDate());
        app.setDeadlineDate(req.deadlineDate());
        return toResponse(applicationRepository.save(app));
    }

    public ApplicationResponse update(UUID id, UpdateApplicationRequest req) {
        JobApplication app = getOrThrow(id);
        app.setCompanyName(req.companyName());
        app.setJobTitle(req.jobTitle());
        app.setJobUrl(req.jobUrl());
        app.setStatus(req.status());
        app.setAppliedDate(req.appliedDate());
        app.setDeadlineDate(req.deadlineDate());
        return toResponse(applicationRepository.save(app));
    }

    public void delete(UUID id) {
        applicationRepository.delete(getOrThrow(id));
    }

    JobApplication getOrThrow(UUID id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + id));
    }

    private ApplicationResponse toResponse(JobApplication app) {
        return new ApplicationResponse(
                app.getId(),
                app.getCompanyName(),
                app.getJobTitle(),
                app.getJobUrl(),
                app.getStatus(),
                app.getAppliedDate(),
                app.getDeadlineDate(),
                app.getCreatedAt(),
                app.getUpdatedAt(),
                app.getNotes().size(),
                app.getAttachments().size()
        );
    }
}
