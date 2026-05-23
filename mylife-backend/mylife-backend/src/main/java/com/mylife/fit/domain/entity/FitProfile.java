package com.mylife.fit.domain.entity;

import com.mylife.core.domain.entity.User;
import com.mylife.fit.domain.enums.ActivityLevel;
import com.mylife.fit.domain.enums.BiologicalSex;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;

@Entity
@Table(name = "tb_fit_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FitProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** Altura em centímetros */
    @Column(precision = 5, scale = 1)
    private BigDecimal heightCm;

    /** Peso atual em quilogramas */
    @Column(precision = 6, scale = 2)
    private BigDecimal weightKg;

    /** Peso alvo em quilogramas */
    @Column(precision = 6, scale = 2)
    private BigDecimal targetWeightKg;

    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    private BiologicalSex biologicalSex;

    @Enumerated(EnumType.STRING)
    private ActivityLevel activityLevel;

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

    // ── Computed ──────────────────────────────────────────────────────────────

    @Transient
    public Integer getAge() {
        if (birthDate == null) return null;
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    @Transient
    public BigDecimal getBmi() {
        if (heightCm == null || weightKg == null || heightCm.compareTo(BigDecimal.ZERO) == 0) return null;
        BigDecimal heightM = heightCm.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        return weightKg.divide(heightM.multiply(heightM), 2, RoundingMode.HALF_UP);
    }
}
