package com.mylife.fit.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "tb_fit_workout_exercises")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_id", nullable = false)
    @ToString.Exclude
    private Workout workout;

    @Column(nullable = false)
    private String name;

    private Integer sets;

    private Integer reps;

    /** Carga em kg */
    @Column(precision = 6, scale = 2)
    private BigDecimal weightKg;

    /** Duração do exercício em segundos (para séries por tempo) */
    private Integer durationSeconds;

    /** Descanso entre séries em segundos */
    private Integer restSeconds;

    /** Ordem de exibição dentro do treino */
    @Column(name = "exercise_order", nullable = false)
    @Builder.Default
    private Integer exerciseOrder = 0;

    @Column(length = 500)
    private String note;
}
