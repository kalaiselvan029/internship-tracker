
package com.kalai.internship_tracker.dto;

public class ApplicationStatsResponse {

    private long totalApplications;
    private long appliedCount;
    private long assessmentCount;
    private long interviewCount;
    private long offerCount;
    private long rejectedCount;

    public ApplicationStatsResponse() {
    }

    public ApplicationStatsResponse(
            long totalApplications,
            long appliedCount,
            long assessmentCount,
            long interviewCount,
            long offerCount,
            long rejectedCount) {

        this.totalApplications = totalApplications;
        this.appliedCount = appliedCount;
        this.assessmentCount = assessmentCount;
        this.interviewCount = interviewCount;
        this.offerCount = offerCount;
        this.rejectedCount = rejectedCount;
    }

    public long getTotalApplications() {
        return totalApplications;
    }

    public void setTotalApplications(long totalApplications) {
        this.totalApplications = totalApplications;
    }

    public long getAppliedCount() {
        return appliedCount;
    }

    public void setAppliedCount(long appliedCount) {
        this.appliedCount = appliedCount;
    }

    public long getAssessmentCount() {
        return assessmentCount;
    }

    public void setAssessmentCount(long assessmentCount) {
        this.assessmentCount = assessmentCount;
    }

    public long getInterviewCount() {
        return interviewCount;
    }

    public void setInterviewCount(long interviewCount) {
        this.interviewCount = interviewCount;
    }

    public long getOfferCount() {
        return offerCount;
    }

    public void setOfferCount(long offerCount) {
        this.offerCount = offerCount;
    }

    public long getRejectedCount() {
        return rejectedCount;
    }

    public void setRejectedCount(long rejectedCount) {
        this.rejectedCount = rejectedCount;
    }
}
