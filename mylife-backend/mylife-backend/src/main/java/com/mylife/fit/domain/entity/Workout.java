package com.mylife.fit.domain.entity;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.fit.domain.enums.WorkoutStatus;
import com.mylife.fit.domain.enums.WorkoutType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_fit_workouts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Workout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkoutType type;

    @Column(nullable = false)
    private LocalDate date;

    private LocalTime startTime;

    /** Duração total em minutos */
    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private WorkoutStatus status = WorkoutStatus.PLANNED;

    /** Calorias estimadas queimadas */
    private Integer caloriesBurned;

    /** Frequência cardíaca média (bpm) */
    private Integer heartRateAvg;

    /** Distância percorrida em km (para RUNNING, CYCLING, WALKING, SWIMMING) */
    @Column(precision = 7, scale = 2)
    private BigDecimal distanceKm;

    /** Pace ou ritmo médio (ex: "5:30/km") — texto livre */
    @Column(length = 20)
    private String pace;

    @Column(length = 1000)
    private String note;

    @ToString.Exclude
    @OneToMany(mappedBy = "workout", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("exerciseOrder ASC")
    @Builder.Default
    private List<WorkoutExercise> exercises = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_group_id", nullable = false)
    private FamilyGroup familyGroup;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    private void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    private void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
