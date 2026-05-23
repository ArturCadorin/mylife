package com.mylife.finance.domain.entity;

import com.mylife.finance.domain.enums.InvestmentEntryType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_investment_entries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvestmentEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investment_id", nullable = false)
    private Investment investment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvestmentEntryType type;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate date;

    private String note;

    @Column(precision = 19, scale = 2)
    private BigDecimal previousValue;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    private void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
