package com.jobtracker.repository;

import com.jobtracker.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NoteRepository extends JpaRepository<Note, UUID> {
    List<Note> findByJobApplicationIdOrderByCreatedAtDesc(UUID jobApplicationId);
}
