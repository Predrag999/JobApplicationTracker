package com.jobtracker.service;

import com.jobtracker.entity.JobApplication;
import com.jobtracker.entity.Note;
import com.jobtracker.repository.ApplicationRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ExportService {

    private static final String[] HEADERS = {"Company", "Job Title", "Status", "Applied Date", "Deadline", "Notes"};

    private final ApplicationRepository applicationRepository;

    public ExportService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @Transactional(readOnly = true)
    public byte[] export(String format, UUID userId) {
        if (!format.equals("csv") && !format.equals("xlsx")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unsupported format '" + format + "'. Use 'csv' or 'xlsx'.");
        }
        List<JobApplication> apps = applicationRepository.findByUser_IdOrderByAppliedDateDesc(userId);
        return format.equals("xlsx") ? toExcel(apps) : toCsv(apps);
    }

    private byte[] toCsv(List<JobApplication> apps) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.join(",", HEADERS)).append('\n');
        for (JobApplication app : apps) {
            sb.append(csvEscape(app.getCompanyName())).append(',');
            sb.append(csvEscape(app.getJobTitle())).append(',');
            sb.append(csvEscape(app.getStatus().name())).append(',');
            sb.append(csvEscape(app.getAppliedDate() != null ? app.getAppliedDate().toString() : "")).append(',');
            sb.append(csvEscape(app.getDeadlineDate() != null ? app.getDeadlineDate().toString() : "")).append(',');
            sb.append(csvEscape(joinNotes(app))).append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] toExcel(List<JobApplication> apps) {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Applications");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (JobApplication app : apps) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(nullSafe(app.getCompanyName()));
                row.createCell(1).setCellValue(nullSafe(app.getJobTitle()));
                row.createCell(2).setCellValue(app.getStatus().name());
                row.createCell(3).setCellValue(app.getAppliedDate() != null ? app.getAppliedDate().toString() : "");
                row.createCell(4).setCellValue(app.getDeadlineDate() != null ? app.getDeadlineDate().toString() : "");
                row.createCell(5).setCellValue(joinNotes(app));
            }

            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate Excel file");
        }
    }

    private String joinNotes(JobApplication app) {
        return app.getNotes().stream()
                .sorted(Comparator.comparing(Note::getCreatedAt))
                .map(Note::getContent)
                .collect(Collectors.joining(" | "));
    }

    private String csvEscape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String nullSafe(String value) {
        return value != null ? value : "";
    }
}
