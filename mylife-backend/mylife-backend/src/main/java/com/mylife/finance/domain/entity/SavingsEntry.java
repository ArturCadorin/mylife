package com.mylife.finance.domain.entity;

import com.mylife.finance.domain.enums.SavingsEntryType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_savings_entries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavingsEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "savings_id", nullable = false)
    private Savings savings;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SavingsEntryType type;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate date;

    @Column
    private String note;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    private void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
