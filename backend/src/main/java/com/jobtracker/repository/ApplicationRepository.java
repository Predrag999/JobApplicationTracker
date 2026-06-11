package com.jobtracker.repository;

import com.jobtracker.entity.JobApplication;
import com.jobtracker.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<JobApplication, UUID> {

    @Query("""
            SELECT a FROM JobApplication a
            WHERE (:status IS NULL OR a.status = :status)
            AND (LOWER(a.companyName) LIKE LOWER(CONCAT('%', COALESCE(:search, ''), '%'))
                 OR LOWER(a.jobTitle) LIKE LOWER(CONCAT('%', COALESCE(:search, ''), '%')))
            """)
    Page<JobApplication> findAllFiltered(
            @Param("status") ApplicationStatus status,
            @Param("search") String search,
            Pageable pageable);

    long countByStatus(ApplicationStatus status);
}
