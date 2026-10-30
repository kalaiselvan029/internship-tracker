
package com.kalai.internship_tracker.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import com.kalai.internship_tracker.dto.InternshipApplicationResponse;
import com.kalai.internship_tracker.dto.InternshipApplicationRequest;
import com.kalai.internship_tracker.entity.InternshipApplication;
import com.kalai.internship_tracker.dto.ApplicationStatsResponse;
import com.kalai.internship_tracker.repository.InternshipApplicationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.kalai.internship_tracker.entity.AppUser;
@Service
public class InternshipApplicationService {

    private final InternshipApplicationRepository repository;

    public InternshipApplicationService(
            InternshipApplicationRepository repository) {
        this.repository = repository;
    }

    public InternshipApplication createApplication(
            InternshipApplicationRequest request,
            AppUser user) {

        InternshipApplication application = new InternshipApplication();

        copyRequestToEntity(request, application);

        application.setUser(user);

        return repository.save(application);
    }


    public List<InternshipApplicationResponse> getAllApplications() {
        return repository.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public List<InternshipApplicationResponse> getApplicationsByUserId(Long userId) {
        return repository.findByUserId(userId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public Page<InternshipApplicationResponse> getApplicationsWithPagination(
            Long userId, Pageable pageable) {

        return repository.findAllByUserId(userId, pageable)
                .map(this::convertToResponse);
    }

    public List<InternshipApplicationResponse> searchByCompanyName(
            String searchText, Long userId) {

        return repository
                .searchByCompanyOrJobTitle(searchText, userId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public List<InternshipApplicationResponse> filterByStatus(
            String status, Long userId) {

        return repository
                .findByStatusIgnoreCaseAndUserId(status, userId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public List<InternshipApplicationResponse> filterByJobType(
            String jobType,
            Long userId) {

        return repository
                .findByJobTypeIgnoreCaseAndUserId(jobType, userId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public List<InternshipApplicationResponse> searchByCompanyNameAndStatus(
            String companyName,
            String status,
            Long userId) {

        return repository
                .findByCompanyNameContainingIgnoreCaseAndStatusIgnoreCaseAndUserId(
                        companyName, status, userId)
                .stream()
                   .map(this::convertToResponse)
                .toList();
    }

    public Optional<InternshipApplicationResponse> getApplicationById(
            Long id, Long userId) {

        return repository.findByIdAndUserId(id, userId)
                .map(this::convertToResponse);
    }


    public Optional<InternshipApplication> updateApplication(
            Long id,
            Long userId,
            InternshipApplicationRequest request) {

        return repository.findByIdAndUserId(id, userId)
                .map(application -> {
                    copyRequestToEntity(request, application);
                    return repository.save(application);
                });
    }

    public boolean deleteApplication(Long id, Long userId) {

        Optional<InternshipApplication> application =
                repository.findByIdAndUserId(id, userId);

        if (application.isEmpty()) {
            return false;
        }

        repository.delete(application.get());
        return true;
    }

    private void copyRequestToEntity(
            InternshipApplicationRequest request,
            InternshipApplication application) {

        application.setCompanyName(request.getCompanyName());
        application.setJobTitle(request.getJobTitle());
        application.setJobType(request.getJobType());
        application.setJobUrl(request.getJobUrl());
        application.setStatus(request.getStatus());
        application.setAppliedDate(request.getAppliedDate());
        application.setDeadline(request.getDeadline());
        application.setNotes(request.getNotes());
    }


    private InternshipApplicationResponse convertToResponse(
            InternshipApplication application) {

        InternshipApplicationResponse response =
                new InternshipApplicationResponse();

        response.setId(application.getId());
        response.setCompanyName(application.getCompanyName());
        response.setJobTitle(application.getJobTitle());
        response.setJobType(application.getJobType());
        response.setJobUrl(application.getJobUrl());
        response.setStatus(application.getStatus());
        response.setAppliedDate(application.getAppliedDate());
        response.setDeadline(application.getDeadline());
        response.setNotes(application.getNotes());
        response.setCreatedAt(application.getCreatedAt());
        response.setUpdatedAt(application.getUpdatedAt());

        return response;
    }


    public ApplicationStatsResponse getApplicationStats(Long userId) {

        long total = repository.countByUserId(userId);
        long applied = repository.countByUserIdAndStatusIgnoreCase(userId, "APPLIED");
        long assessment = repository.countByUserIdAndStatusIgnoreCase(userId, "ASSESSMENT");
        long interview = repository.countByUserIdAndStatusIgnoreCase(userId, "INTERVIEW");
        long offer = repository.countByUserIdAndStatusIgnoreCase(userId, "OFFER");
        long rejected = repository.countByUserIdAndStatusIgnoreCase(userId, "REJECTED");

        return new ApplicationStatsResponse(
                total, applied, assessment, interview, offer, rejected
        );
    }


}
