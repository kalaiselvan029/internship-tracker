
package com.kalai.internship_tracker.repository;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import com.kalai.internship_tracker.entity.InternshipApplication;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import com.kalai.internship_tracker.entity.InternshipApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface InternshipApplicationRepository
        extends JpaRepository<InternshipApplication, Long> {

    List<InternshipApplication> findByCompanyNameContainingIgnoreCase(
            String companyName);
    List<InternshipApplication>
    findByCompanyNameContainingIgnoreCaseAndUserId(
            String companyName, Long userId);

    @Query("""
    SELECT a FROM InternshipApplication a
    WHERE a.user.id = :userId
      AND (
          LOWER(a.companyName) LIKE LOWER(CONCAT('%', :searchText, '%'))
          OR LOWER(a.jobTitle) LIKE LOWER(CONCAT('%', :searchText, '%'))
      )
    """)
    List<InternshipApplication> searchByCompanyOrJobTitle(
            @Param("searchText") String searchText,
            @Param("userId") Long userId
    );

    List<InternshipApplication> findByJobTypeIgnoreCaseAndUserId(
            String jobType,
            Long userId
    );

    List<InternshipApplication> findByStatusIgnoreCase(String status);
    List<InternshipApplication> findByStatusIgnoreCaseAndUserId(
            String status, Long userId);

    List<InternshipApplication>
    findByCompanyNameContainingIgnoreCaseOrJobTitleContainingIgnoreCaseAndUserId(
            String companyName,
            String jobTitle,
            Long userId);



    List<InternshipApplication> findByCompanyNameContainingIgnoreCaseAndStatusIgnoreCase(
            String companyName,
            String status);
    List<InternshipApplication>
    findByCompanyNameContainingIgnoreCaseAndStatusIgnoreCaseAndUserId(
            String companyName, String status, Long userId);

    long countByStatusIgnoreCase(String status);
    List<InternshipApplication> findByUserId(Long userId);

    Optional<InternshipApplication> findByIdAndUserId(
            Long id, Long userId);

    Page<InternshipApplication> findAllByUserId(
            Long userId, Pageable pageable);
    long countByUserId(Long userId);

    long countByUserIdAndStatusIgnoreCase(Long userId, String status);

}
