
package com.kalai.internship_tracker.controller;

import java.util.List;
import java.util.Optional;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.kalai.internship_tracker.dto.ApplicationStatsResponse;
import com.kalai.internship_tracker.dto.ErrorResponse;
import com.kalai.internship_tracker.dto.InternshipApplicationRequest;
import com.kalai.internship_tracker.dto.InternshipApplicationResponse;
import com.kalai.internship_tracker.entity.AppUser;
import com.kalai.internship_tracker.entity.InternshipApplication;
import com.kalai.internship_tracker.repository.AppUserRepository;
import com.kalai.internship_tracker.service.InternshipApplicationService;

@RestController
@RequestMapping("/api/applications")
public class InternshipApplicationController {

    private final InternshipApplicationService service;
    private final AppUserRepository appUserRepository;

    public InternshipApplicationController(
            InternshipApplicationService service,
            AppUserRepository appUserRepository) {
        this.service = service;
        this.appUserRepository = appUserRepository;
    }

    @PostMapping
    public ResponseEntity<InternshipApplication> createApplication(
            @Valid @RequestBody InternshipApplicationRequest request,
            Authentication authentication) {

        AppUser user = getLoggedInUser(authentication);

        InternshipApplication saved =
                service.createApplication(request, user);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<InternshipApplicationResponse>> getAllApplications(
            Authentication authentication) {

        AppUser user = getLoggedInUser(authentication);

        return ResponseEntity.ok(
                service.getApplicationsByUserId(user.getId())
        );
    }

    @GetMapping("/stats")
    public ResponseEntity<ApplicationStatsResponse> getApplicationStats(
            Authentication authentication) {

        AppUser user = getLoggedInUser(authentication);

        return ResponseEntity.ok(
                service.getApplicationStats(user.getId())
        );
    }

    @GetMapping("/page")
    public ResponseEntity<Page<InternshipApplicationResponse>> getApplicationsWithPagination(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            Authentication authentication) {

        AppUser user = getLoggedInUser(authentication);

        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(
                service.getApplicationsWithPagination(user.getId(), pageable)
        );
    }

    @GetMapping("/search")
    public ResponseEntity<List<InternshipApplicationResponse>> searchByCompanyName(
            @RequestParam String searchText,
            Authentication authentication) {

        AppUser user = getLoggedInUser(authentication);

        return ResponseEntity.ok(
                service.searchByCompanyName(searchText, user.getId())
        );
    }

    @GetMapping("/filter")
    public ResponseEntity<List<InternshipApplicationResponse>> filterByStatus(
            @RequestParam String status,
            Authentication authentication) {

        AppUser user = getLoggedInUser(authentication);

        return ResponseEntity.ok(
                service.filterByStatus(status, user.getId())
        );
    }

    @GetMapping("/filter/job-type")
    public ResponseEntity<List<InternshipApplicationResponse>> filterByJobType(
            @RequestParam String jobType,
            Authentication authentication) {

        AppUser user = getLoggedInUser(authentication);

        return ResponseEntity.ok(
                service.filterByJobType(jobType, user.getId())
        );
    }

    @GetMapping("/search/filter")
    public ResponseEntity<List<InternshipApplicationResponse>> searchByCompanyNameAndStatus(
            @RequestParam String companyName,
            @RequestParam String status,
            Authentication authentication) {

        AppUser user = getLoggedInUser(authentication);

        return ResponseEntity.ok(
                service.searchByCompanyNameAndStatus(
                        companyName, status, user.getId())
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getApplicationById(
            @PathVariable Long id,
            Authentication authentication) {

        AppUser user = getLoggedInUser(authentication);

        Optional<InternshipApplicationResponse> application =
                service.getApplicationById(id, user.getId());

        if (application.isPresent()) {
            return ResponseEntity.ok(application.get());
        }

        ErrorResponse error = new ErrorResponse(
                404,
                "Not Found",
                "Application not found",
                "/api/applications/" + id
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateApplication(
            @PathVariable Long id,
            @Valid @RequestBody InternshipApplicationRequest request,
            Authentication authentication) {

        AppUser user = getLoggedInUser(authentication);

        return service.updateApplication(id, user.getId(), request)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> {
                    ErrorResponse error = new ErrorResponse(
                            404,
                            "Not Found",
                            "Application not found",
                            "/api/applications/" + id
                    );

                    return ResponseEntity
                            .status(HttpStatus.NOT_FOUND)
                            .body(error);
                });
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteApplication(
            @PathVariable Long id,
            Authentication authentication) {

        AppUser user = getLoggedInUser(authentication);

        boolean deleted = service.deleteApplication(id, user.getId());

        if (!deleted) {
            ErrorResponse error = new ErrorResponse(
                    404,
                    "Not Found",
                    "Application not found",
                    "/api/applications/" + id
            );

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        return ResponseEntity.noContent().build();
    }

    private AppUser getLoggedInUser(Authentication authentication) {
        String email = authentication.getName();

        return appUserRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
