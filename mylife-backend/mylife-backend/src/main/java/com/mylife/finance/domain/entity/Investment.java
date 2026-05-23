package com.mylife.finance.domain.entity;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.finance.domain.enums.FixedIncomeIndexer;
import com.mylife.finance.domain.enums.InvestmentType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_investments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Investment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvestmentType type;

    @Column(nullable = false)
    private String institution;

    @Column(nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal totalInvested = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal currentValue = BigDecimal.ZERO;

    @Transient
    private BigDecimal yieldAmount;

    @Transient
    private BigDecimal yieldPercentage;

    // Fixed income only
    @Enumerated(EnumType.STRING)
    private FixedIncomeIndexer indexer;

    @Column(precision = 7, scale = 4)
    private BigDecimal indexerRate;

    @Column(precision = 7, scale = 4)
    private BigDecimal fixedRate;

    @Column(precision = 7, scale = 4)
    private BigDecimal currentIndexValue;

    private LocalDate maturityDate;

    @Transient
    private BigDecimal estimatedReturn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_account_id")
    private Account linkedAccount;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_group_id", nullable = false)
    private FamilyGroup familyGroup;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime lastUpdatedAt;

    @PostLoad
    public void onLoad() {
        recalculate();
    }

    @PrePersist
    private void prePersist() {
        createdAt = LocalDateTime.now();
        lastUpdatedAt = LocalDateTime.now();
        recalculate();
    }

    public void recalculate() {
        calcularYield();
        if (type == InvestmentType.FIXED_INCOME) {
            calcularEstimatedReturn();
        }
    }

    public void calcularYield() {
        if (currentValue != null && totalInvested != null) {
            yieldAmount = currentValue.subtract(totalInvested).setScale(2, RoundingMode.HALF_UP);
            yieldPercentage = totalInvested.compareTo(BigDecimal.ZERO) != 0
                    ? yieldAmount.multiply(BigDecimal.valueOf(100)).divide(totalInvested, 4, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
        } else {
            yieldAmount = BigDecimal.ZERO;
            yieldPercentage = BigDecimal.ZERO;
        }
    }

    public void calcularEstimatedReturn() {
        if (currentValue != null && indexerRate != null && currentIndexValue != null) {
            estimatedReturn = currentValue
                    .multiply(indexerRate.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP))
                    .multiply(currentIndexValue.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP))
                    .setScale(2, RoundingMode.HALF_UP);
        } else if (currentValue != null && fixedRate != null) {
            // PREFIXED: rendimento sobre o valor atual à taxa fixa ao ano
            estimatedReturn = currentValue
                    .multiply(fixedRate.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP))
                    .setScale(2, RoundingMode.HALF_UP);
        } else {
            estimatedReturn = BigDecimal.ZERO;
        }
    }
}
