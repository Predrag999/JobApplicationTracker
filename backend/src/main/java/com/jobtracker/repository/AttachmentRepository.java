package com.jobtracker.repository;

import com.jobtracker.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {
    List<Attachment> findByJobApplicationIdOrderByCreatedAtDesc(UUID jobApplicationId);
}
