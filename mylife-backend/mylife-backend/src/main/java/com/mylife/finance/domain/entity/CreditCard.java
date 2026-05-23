package com.mylife.finance.domain.entity;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_credit_cards")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String bankName;

    @Column
    private String color;

    @Column(length = 4)
    private String lastFourDigits;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal totalLimit;

    @Column(nullable = false)
    private Integer closingDay;

    @Column(nullable = false)
    private Integer dueDay;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_account_id")
    private Account linkedAccount;

    @Column(nullable = false)
    private boolean active;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_group_id", nullable = false)
    private FamilyGroup familyGroup;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    private void prePersist() {
        createdAt = LocalDateTime.now();
        active = true;
    }
}
