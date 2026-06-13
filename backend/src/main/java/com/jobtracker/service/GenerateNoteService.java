package com.jobtracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.dto.response.GeneratedNoteResponse;
import com.jobtracker.entity.JobApplication;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GenerateNoteService {

    private static final Logger log = LoggerFactory.getLogger(GenerateNoteService.class);
    private static final String MODEL = "claude-haiku-4-5-20251001";
    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private static final ObjectMapper JSON = new ObjectMapper();

    private final ApplicationService applicationService;

    @Value("${anthropic.api-key:}")
    private String apiKey;

    public GenerateNoteService(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    public GeneratedNoteResponse generate(UUID applicationId) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI generation is not configured. Set the ANTHROPIC_API_KEY environment variable.");
        }
        JobApplication app = applicationService.getOrThrow(applicationId);
        String jobUrl = app.getJobUrl();
        if (jobUrl == null || jobUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "This application has no job URL to generate a note from.");
        }

        String description = scrapeDescription(jobUrl);
        String generated = callClaudeApi(description);
        return new GeneratedNoteResponse(generated);
    }

    private String scrapeDescription(String url) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .timeout(10000)
                    .followRedirects(true)
                    .ignoreHttpErrors(true)
                    .get();

            if (applicationService.isBotProtected(doc)) {
                log.info("Bot protection detected for {}, escalating to Playwright", url);
                try {
                    doc = applicationService.fetchWithPlaywright(url);
                } catch (Exception e) {
                    log.warn("Playwright fallback failed: {}", e.getMessage());
                }
            }
            if (applicationService.isBotProtected(doc)) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "This site uses bot protection. Please write the note manually.");
            }
            return applicationService.extractJobDescription(doc);
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            log.warn("Scrape failed for {}: {}", url, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Could not fetch the job posting. Please write the note manually.");
        }
    }

    private String callClaudeApi(String description) {
        try {
            String prompt = "The following text was extracted from a job posting web page. " +
                    "Write a 2-3 sentence note summarizing the key role, main requirements, " +
                    "and anything worth highlighting. " +
                    "Work only with the text provided — do not ask for more information or mention that text is missing. " +
                    "Plain text only, no bullet points or markdown.\n\nExtracted text:\n" + description;

            String body = JSON.writeValueAsString(Map.of(
                    "model", MODEL,
                    "max_tokens", 300,
                    "messages", List.of(Map.of("role", "user", "content", prompt))
            ));

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL))
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                log.warn("Claude API returned {}: {}", resp.statusCode(), resp.body());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "AI service returned an error. Please try again.");
            }

            JsonNode root = JSON.readTree(resp.body());
            return root.path("content").get(0).path("text").asText().trim();
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            log.warn("Claude API call failed: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Could not generate a note. Please try again or write one manually.");
        }
    }
}
