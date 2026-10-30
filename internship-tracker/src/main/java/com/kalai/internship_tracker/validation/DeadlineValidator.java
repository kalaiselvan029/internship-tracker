
package com.kalai.internship_tracker.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import com.kalai.internship_tracker.dto.InternshipApplicationRequest;

public class DeadlineValidator
        implements ConstraintValidator<ValidDeadline,
        InternshipApplicationRequest> {

    @Override
    public boolean isValid(
            InternshipApplicationRequest request,
            ConstraintValidatorContext context) {

        if (request == null
                || request.getAppliedDate() == null
                || request.getDeadline() == null) {
            return true;
        }

        return !request.getDeadline()
                .isBefore(request.getAppliedDate());
    }
}
