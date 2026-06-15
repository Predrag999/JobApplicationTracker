package com.jobtracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.dto.request.CreateApplicationRequest;
import com.jobtracker.dto.request.UpdateApplicationRequest;
import com.jobtracker.dto.response.ApplicationResponse;
import com.jobtracker.dto.response.AutofillResponse;
import com.jobtracker.dto.response.PagedResponse;
import com.jobtracker.entity.JobApplication;
import com.jobtracker.entity.User;
import com.jobtracker.enums.ApplicationStatus;
import com.jobtracker.exception.ResourceNotFoundException;
import com.jobtracker.repository.ApplicationRepository;
import com.jobtracker.repository.UserRepository;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.LoadState;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@Transactional
public class ApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    public ApplicationService(ApplicationRepository applicationRepository, UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ApplicationResponse> findAll(
            UUID userId,
            ApplicationStatus status, String search,
            int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Page<JobApplication> result = applicationRepository.findAllFiltered(
                userId, status, search, PageRequest.of(page, size, sort));
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
    public ApplicationResponse findById(UUID id, UUID userId) {
        return toResponse(getOrThrow(id, userId));
    }

    public ApplicationResponse create(CreateApplicationRequest req, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        JobApplication app = new JobApplication();
        app.setUser(user);
        app.setCompanyName(req.companyName());
        app.setJobTitle(req.jobTitle());
        app.setJobUrl(req.jobUrl());
        app.setStatus(req.status());
        app.setAppliedDate(req.appliedDate());
        app.setDeadlineDate(req.deadlineDate());
        return toResponse(applicationRepository.save(app));
    }

    public ApplicationResponse update(UUID id, UpdateApplicationRequest req, UUID userId) {
        JobApplication app = getOrThrow(id, userId);
        app.setCompanyName(req.companyName());
        app.setJobTitle(req.jobTitle());
        app.setJobUrl(req.jobUrl());
        app.setStatus(req.status());
        app.setAppliedDate(req.appliedDate());
        app.setDeadlineDate(req.deadlineDate());
        return toResponse(applicationRepository.save(app));
    }

    public void delete(UUID id, UUID userId) {
        applicationRepository.delete(getOrThrow(id, userId));
    }

    public AutofillResponse autofill(String url) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .header("Cache-Control", "no-cache")
                    .referrer("https://www.google.com/")
                    .timeout(10000)
                    .followRedirects(true)
                    .ignoreHttpErrors(true)
                    .get();

            String[] fields = extractJobFields(doc, url);
            String jobTitle = fields[0];
            String companyName = fields[1];

            // Bot-protected HTML or Jsoup got a JS-rendered shell with site-default values
            if (isBotProtected(doc) || isLikelyJobBoardDefault(jobTitle, url)) {
                log.info("Escalating to headless browser for {}", url);
                try {
                    doc = fetchWithPlaywright(url);
                    fields = extractJobFields(doc, url);
                    jobTitle = fields[0];
                    companyName = fields[1];
                } catch (Exception browserEx) {
                    log.warn("Headless browser fetch failed for {}: {}", url, browserEx.getMessage());
                }
            }

            // After all attempts, if still bot-protected, fail clearly rather than return wrong data
            if (isBotProtected(doc)) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "This site uses bot protection that prevents automated data extraction. Please fill in the fields manually.");
            }

            if (companyName == null) companyName = hostnameToCompany(url);

            log.info("Autofill extracted — company: '{}', title: '{}' from {}", companyName, jobTitle, url);
            return new AutofillResponse(
                    companyName != null ? companyName : "",
                    jobTitle != null ? jobTitle : "",
                    url
            );
        } catch (org.springframework.web.server.ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            log.warn("Autofill failed for URL '{}': {}", url, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not fetch job details from the provided URL");
        }
    }

    private String[] extractJobFields(Document doc, String pageUrl) {
        String jobTitle = null;
        String companyName = null;

        // 1. JSON-LD JobPosting schema (most reliable — used for Google for Jobs)
        Elements scripts = doc.select("script[type=application/ld+json]");
        for (Element script : scripts) {
            try {
                JsonNode node = JSON.readTree(script.data());
                JsonNode posting = findJobPosting(node);
                if (posting != null) {
                    if (posting.has("title")) jobTitle = posting.get("title").asText();
                    JsonNode org = posting.get("hiringOrganization");
                    if (org != null) {
                        String ldName   = org.has("name")   ? org.get("name").asText()   : null;
                        String ldSameAs = org.has("sameAs") ? org.get("sameAs").asText() : null;
                        // Some sites (e.g. dev.bg) incorrectly put the profile URL in "name"
                        // and the real company name in "sameAs"
                        if (ldName != null && !looksLikeUrl(ldName)) {
                            companyName = ldName;
                        } else if (ldSameAs != null && !looksLikeUrl(ldSameAs)) {
                            companyName = ldSameAs;
                        } else if (ldName != null && looksLikeUrl(ldName)) {
                            companyName = slugToCompanyName(extractCompanySlug(ldName));
                        }
                    }
                    break;
                }
            } catch (Exception ignored) {}
        }

        // 2. OpenGraph meta tags — skip og:title when it looks like a site/domain name
        //    (JS-rendered pages keep static meta tags even after Playwright renders real content into H1)
        if (jobTitle == null) {
            Element ogTitle = doc.selectFirst("meta[property=og:title]");
            if (ogTitle != null) {
                String val = ogTitle.attr("content");
                if (!isLikelyJobBoardDefault(val, pageUrl)) jobTitle = val;
            }
        }
        if (companyName == null) {
            Element ogSite = doc.selectFirst("meta[property=og:site_name]");
            if (ogSite != null && !ogSite.attr("content").isBlank()) companyName = ogSite.attr("content");
        }

        // 3. Microdata and common job-board CSS selectors (reliable on Playwright-rendered pages)
        if (companyName == null) {
            String[] companySelectors = {
                "[itemprop=hiringOrganization] [itemprop=name]",
                "[itemprop=name]",
                ".job-company-name", ".company-name", ".employer-name",
                ".employer", "[data-company]",
                "a[href*='/company/']", "a[href*='/employer/']",
                ".job-header .company", ".position-company"
            };
            for (String sel : companySelectors) {
                Element el = doc.selectFirst(sel);
                if (el != null && !el.text().isBlank()) {
                    String text = el.text().trim();
                    // Some sites (e.g. dev.bg) render the company profile URL as the link text
                    if (looksLikeUrl(text)) {
                        String href = el.attr("abs:href");
                        if (href.isBlank()) href = el.attr("href");
                        if (href.isBlank()) href = text;
                        text = slugToCompanyName(extractCompanySlug(href));
                    }
                    if (!text.isBlank()) {
                        companyName = text;
                        break;
                    }
                }
            }
        }

        // 4. H1 tag, then <title> as final fallbacks for job title
        if (jobTitle == null) {
            Element h1 = doc.selectFirst("h1");
            if (h1 != null) jobTitle = h1.text();
        }
        if (jobTitle == null) {
            String title = doc.title();
            if (title != null && !title.isBlank()) jobTitle = title;
        }

        return new String[]{jobTitle, companyName};
    }

    String extractJobDescription(Document doc) {
        Elements scripts = doc.select("script[type=application/ld+json]");
        for (Element script : scripts) {
            try {
                JsonNode posting = findJobPosting(JSON.readTree(script.data()));
                if (posting != null && posting.has("description")) {
                    String d = posting.get("description").asText();
                    if (!d.isBlank()) return truncate(d, 10000);
                }
            } catch (Exception ignored) {}
        }
        for (String sel : new String[]{
                "[itemprop=description]", ".job-description", "#job-description",
                ".job-body", ".job-details", "article", "main"}) {
            Element el = doc.selectFirst(sel);
            if (el != null && !el.text().isBlank()) return truncate(el.text(), 10000);
        }
        return truncate(doc.body().text(), 10000);
    }

    private String truncate(String text, int max) {
        return text.length() > max ? text.substring(0, max) : text;
    }

    private boolean looksLikeUrl(String text) {
        return text.startsWith("http://") || text.startsWith("https://") || text.startsWith("/");
    }

    private String extractCompanySlug(String url) {
        try {
            String path = url.contains("://") ? new java.net.URL(url).getPath() : url;
            String[] parts = path.split("/");
            // Return the segment immediately after "company", "employer", or "companies"
            for (int i = 0; i < parts.length - 1; i++) {
                String seg = parts[i].toLowerCase();
                if ((seg.equals("company") || seg.equals("employer") || seg.equals("companies")) && !parts[i + 1].isBlank()) {
                    return parts[i + 1];
                }
            }
            // Fallback: last non-empty segment
            for (int i = parts.length - 1; i >= 0; i--) {
                if (!parts[i].isBlank()) return parts[i];
            }
        } catch (Exception ignored) {}
        return "";
    }

    private String slugToCompanyName(String slug) {
        if (slug.isBlank()) return "";
        return java.util.Arrays.stream(slug.split("[-_]"))
                .filter(w -> !w.isBlank())
                .map(w -> Character.toUpperCase(w.charAt(0)) + w.substring(1))
                .collect(java.util.stream.Collectors.joining(" "));
    }

    private boolean isLikelyJobBoardDefault(String jobTitle, String url) {
        if (jobTitle == null) return true;
        try {
            String host = new java.net.URL(url).getHost().replaceFirst("^www\\.", "").toLowerCase();
            String normalized = jobTitle.toLowerCase().trim();
            // Title equals the hostname, is a sub-part of it, or looks like a bare domain
            return host.equals(normalized)
                    || host.startsWith(normalized + ".")
                    || normalized.matches("[a-z0-9][a-z0-9\\-]*\\.[a-z]{2,6}");
        } catch (Exception e) {
            return false;
        }
    }

    boolean isBotProtected(Document doc) {
        String title = doc.title();
        String html = doc.html();
        boolean titleMatch = title != null && (title.contains("Just a moment") || title.contains("Attention Required") || title.contains("Access denied"));
        boolean cfMatch = html.contains("cf_chl_opt") || html.contains("__cf_chl_")
                || !doc.select("script[src*='cdn-cgi/challenge-platform']").isEmpty();
        boolean dataDomeMatch = html.contains("captcha-delivery.com");
        boolean genericCaptcha = html.contains("recaptcha/api.js") || html.contains("hcaptcha.com/1/api.js");
        return titleMatch || cfMatch || dataDomeMatch || genericCaptcha;
    }

    Document fetchWithPlaywright(String url) throws Exception {
        try (Playwright pw = Playwright.create()) {
            BrowserType.LaunchOptions opts = new BrowserType.LaunchOptions()
                    .setHeadless(true)
                    .setArgs(java.util.List.of(
                        "--disable-blink-features=AutomationControlled",
                        "--no-sandbox",
                        "--disable-dev-shm-usage"
                    ));
            try (Browser browser = pw.chromium().launch(opts)) {
                BrowserContext ctx = browser.newContext(new Browser.NewContextOptions()
                        .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")
                        .setLocale("en-US")
                        .setViewportSize(1280, 800));
                // Hide the navigator.webdriver flag that Cloudflare checks
                ctx.addInitScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
                com.microsoft.playwright.Page page = ctx.newPage();
                page.navigate(url, new com.microsoft.playwright.Page.NavigateOptions().setTimeout(30000));

                // Wait until Cloudflare challenge scripts are gone AND an H1 with text is present
                try {
                    page.waitForFunction(
                        "() => !document.body.innerHTML.includes('cf_chl_opt')" +
                        " && document.querySelector('h1') !== null" +
                        " && document.querySelector('h1').innerText.trim().length > 0",
                        new com.microsoft.playwright.Page.WaitForFunctionOptions().setTimeout(25000)
                    );
                } catch (Exception waitEx) {
                    log.warn("Playwright: content wait timed out for {} — proceeding with current state", url);
                }
                log.info("Playwright page title: '{}', h1: '{}'", page.title(),
                        page.evaluate("() => { const h = document.querySelector('h1'); return h ? h.innerText.trim() : '(none)'; }"));

                String html = page.content();
                return Jsoup.parse(html, url);
            }
        }
    }

    private JsonNode findJobPosting(JsonNode node) {
        if (node.isArray()) {
            for (JsonNode item : node) {
                JsonNode found = findJobPosting(item);
                if (found != null) return found;
            }
        } else if (node.isObject()) {
            JsonNode type = node.get("@type");
            if (type != null && "JobPosting".equals(type.asText())) return node;
        }
        return null;
    }

    private String hostnameToCompany(String url) {
        try {
            String host = new java.net.URL(url).getHost();
            host = host.replaceFirst("^www\\.", "");
            // Strip TLD: stripe.com -> stripe
            int dot = host.lastIndexOf('.');
            if (dot > 0) host = host.substring(0, dot);
            // Handle subdomains like careers.google -> google
            int lastDot = host.lastIndexOf('.');
            if (lastDot > 0) host = host.substring(lastDot + 1);
            return Character.toUpperCase(host.charAt(0)) + host.substring(1);
        } catch (Exception e) {
            return null;
        }
    }

    JobApplication getOrThrow(UUID id, UUID userId) {
        JobApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + id));
        if (app.getUser() == null || !app.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return app;
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
