package com.mylife.fit.repository;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.fit.domain.entity.Workout;
import com.mylife.fit.domain.enums.WorkoutStatus;
import com.mylife.fit.domain.enums.WorkoutType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface WorkoutRepository extends JpaRepository<Workout, Long> {

    // OWNER — vê todos do grupo
    Page<Workout> findByFamilyGroup(FamilyGroup familyGroup, Pageable pageable);

    // MEMBER — vê apenas os seus
    Page<Workout> findByOwner(User owner, Pageable pageable);

    // Filtros combinados
    @Query("""
        SELECT w FROM Workout w
        WHERE w.familyGroup = :fg
          AND (:type IS NULL OR w.type = :type)
          AND (:status IS NULL OR w.status = :status)
          AND (:from IS NULL OR w.date >= :from)
          AND (:to IS NULL OR w.date <= :to)
    """)
    Page<Workout> findByFamilyGroupFiltered(
            @Param("fg") FamilyGroup fg,
            @Param("type") WorkoutType type,
            @Param("status") WorkoutStatus status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    @Query("""
        SELECT w FROM Workout w
        WHERE w.owner = :owner
          AND (:type IS NULL OR w.type = :type)
          AND (:status IS NULL OR w.status = :status)
          AND (:from IS NULL OR w.date >= :from)
          AND (:to IS NULL OR w.date <= :to)
    """)
    Page<Workout> findByOwnerFiltered(
            @Param("owner") User owner,
            @Param("type") WorkoutType type,
            @Param("status") WorkoutStatus status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    // Para summary — workouts completados no período
    List<Workout> findByOwnerAndStatusAndDateBetween(
            User owner, WorkoutStatus status, LocalDate from, LocalDate to);

    List<Workout> findByFamilyGroupAndStatusAndDateBetween(
            FamilyGroup familyGroup, WorkoutStatus status, LocalDate from, LocalDate to);
}
