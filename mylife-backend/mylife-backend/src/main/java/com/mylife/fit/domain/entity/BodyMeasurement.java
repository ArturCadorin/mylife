package com.mylife.fit.domain.entity;

import com.mylife.core.domain.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_fit_measurements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BodyMeasurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    /** Peso em kg */
    @Column(precision = 6, scale = 2)
    private BigDecimal weightKg;

    /** % de gordura corporal */
    @Column(precision = 5, scale = 2)
    private BigDecimal bodyFatPercentage;

    /** Massa muscular em kg */
    @Column(precision = 6, scale = 2)
    private BigDecimal muscleMassKg;

    /** Circunferências em centímetros */
    @Column(precision = 5, scale = 1)
    private BigDecimal waistCm;

    @Column(precision = 5, scale = 1)
    private BigDecimal chestCm;

    @Column(precision = 5, scale = 1)
    private BigDecimal hipsCm;

    @Column(precision = 5, scale = 1)
    private BigDecimal leftArmCm;

    @Column(precision = 5, scale = 1)
    private BigDecimal rightArmCm;

    @Column(precision = 5, scale = 1)
    private BigDecimal leftThighCm;

    @Column(precision = 5, scale = 1)
    private BigDecimal rightThighCm;

    @Column(length = 500)
    private String note;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    private void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
