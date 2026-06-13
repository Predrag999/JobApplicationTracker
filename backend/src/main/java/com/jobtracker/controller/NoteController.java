package com.jobtracker.controller;

import com.jobtracker.dto.request.CreateNoteRequest;
import com.jobtracker.dto.response.GeneratedNoteResponse;
import com.jobtracker.dto.response.NoteResponse;
import com.jobtracker.service.GenerateNoteService;
import com.jobtracker.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications/{applicationId}/notes")
public class NoteController {

    private final NoteService noteService;
    private final GenerateNoteService generateNoteService;

    public NoteController(NoteService noteService, GenerateNoteService generateNoteService) {
        this.noteService = noteService;
        this.generateNoteService = generateNoteService;
    }

    @GetMapping
    public List<NoteResponse> list(@PathVariable UUID applicationId) {
        return noteService.findByApplicationId(applicationId);
    }

    @PostMapping
    public ResponseEntity<NoteResponse> create(@PathVariable UUID applicationId,
                                                @Valid @RequestBody CreateNoteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noteService.create(applicationId, req));
    }

    @DeleteMapping("/{noteId}")
    public ResponseEntity<Void> delete(@PathVariable UUID applicationId,
                                        @PathVariable UUID noteId) {
        noteService.delete(applicationId, noteId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate")
    public ResponseEntity<GeneratedNoteResponse> generateNote(@PathVariable UUID applicationId) {
        return ResponseEntity.ok(generateNoteService.generate(applicationId));
    }
}
