
package com.kalai.internship_tracker.dto;

import java.time.LocalDate;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import com.kalai.internship_tracker.validation.ValidDeadline;
@ValidDeadline
public class InternshipApplicationRequest {

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Job title is required")
    private String jobTitle;

    @NotBlank(message = "Job type is required")
    @Pattern(
            regexp = "INTERNSHIP|FULL_TIME|PART_TIME|CONTRACT",
            message = "Job type must be INTERNSHIP, FULL_TIME, PART_TIME, or CONTRACT"
    )
    private String jobType;

    private String jobUrl;


    @NotBlank(message = "Status is required")
    @Pattern(
            regexp = "APPLIED|ASSESSMENT|INTERVIEW|OFFER|REJECTED",
            message = "Status must be APPLIED, ASSESSMENT, INTERVIEW, OFFER, or REJECTED"
    )
    private String status;



    @NotNull(message = "Applied date is required")
    @PastOrPresent(message = "Applied date cannot be in the future")
    private LocalDate appliedDate;


    private LocalDate deadline;

    private String notes;

    public InternshipApplicationRequest() {
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getJobType() {
        return jobType;
    }

    public void setJobType(String jobType) {
        this.jobType = jobType;
    }

    public String getJobUrl() {
        return jobUrl;
    }

    public void setJobUrl(String jobUrl) {
        this.jobUrl = jobUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getAppliedDate() {
        return appliedDate;
    }

    public void setAppliedDate(LocalDate appliedDate) {
        this.appliedDate = appliedDate;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
