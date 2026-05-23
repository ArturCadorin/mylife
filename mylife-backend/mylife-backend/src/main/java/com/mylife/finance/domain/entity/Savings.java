package com.mylife.finance.domain.entity;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_savings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Savings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column(precision = 19, scale = 2)
    private BigDecimal targetAmount;

    @Column(nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal currentAmount = BigDecimal.ZERO;

    @Column(nullable = true, precision = 7, scale = 4)
    private BigDecimal cdiRate;

    @Column(nullable = true, precision = 7, scale = 4)
    private BigDecimal currentCdiValue;

    @Transient
    private BigDecimal estimatedReturn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_account_id")
    private Account linkedAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_group_id", nullable = false)
    private FamilyGroup familyGroup;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PostLoad
    public void calcularEstimatedReturn() {
        if (currentAmount != null && cdiRate != null && currentCdiValue != null) {
            this.estimatedReturn = currentAmount
                    .multiply(cdiRate.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP))
                    .multiply(currentCdiValue.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP))
                    .setScale(2, RoundingMode.HALF_UP);
        } else {
            this.estimatedReturn = BigDecimal.ZERO;
        }
    }

    @PrePersist
    private void prePersist() {
        createdAt = LocalDateTime.now();
        calcularEstimatedReturn();
    }
}
