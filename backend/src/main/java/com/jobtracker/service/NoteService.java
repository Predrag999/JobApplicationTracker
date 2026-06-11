package com.jobtracker.service;

import com.jobtracker.dto.request.CreateNoteRequest;
import com.jobtracker.dto.response.NoteResponse;
import com.jobtracker.entity.Note;
import com.jobtracker.exception.ResourceNotFoundException;
import com.jobtracker.repository.NoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NoteService {

    private final NoteRepository noteRepository;
    private final ApplicationService applicationService;

    public NoteService(NoteRepository noteRepository, ApplicationService applicationService) {
        this.noteRepository = noteRepository;
        this.applicationService = applicationService;
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> findByApplicationId(UUID applicationId) {
        applicationService.getOrThrow(applicationId);
        return noteRepository.findByJobApplicationIdOrderByCreatedAtDesc(applicationId)
                .stream().map(this::toResponse).toList();
    }

    public NoteResponse create(UUID applicationId, CreateNoteRequest req) {
        Note note = new Note();
        note.setJobApplication(applicationService.getOrThrow(applicationId));
        note.setContent(req.content());
        return toResponse(noteRepository.save(note));
    }

    public void delete(UUID applicationId, UUID noteId) {
        applicationService.getOrThrow(applicationId);
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found: " + noteId));
        noteRepository.delete(note);
    }

    private NoteResponse toResponse(Note note) {
        return new NoteResponse(note.getId(), note.getContent(), note.getCreatedAt());
    }
}
