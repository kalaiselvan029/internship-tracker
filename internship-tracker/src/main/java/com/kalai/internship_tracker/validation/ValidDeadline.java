
package com.kalai.internship_tracker.validation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Constraint(validatedBy = DeadlineValidator.class)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidDeadline {

    String message() default
            "Deadline cannot be before the applied date";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
