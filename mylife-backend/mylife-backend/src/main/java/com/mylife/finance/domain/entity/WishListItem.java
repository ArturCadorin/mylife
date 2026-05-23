package com.mylife.finance.domain.entity;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.finance.domain.enums.WishListCategory;
import com.mylife.finance.domain.enums.WishListPriority;
import com.mylife.finance.domain.enums.WishListStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;

@Entity
@Table(name = "tb_wish_list_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal estimatedPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WishListCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WishListPriority priority;

    // Persistido como "yyyy-MM" via YearMonthConverter (autoApply = true)
    @Column(nullable = false, name = "estimated_month")
    private YearMonth estimatedMonth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private WishListStatus status = WishListStatus.PENDING;

    @Column
    private LocalDate purchasedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_account_id")
    private Account linkedAccount;

    // TODO: substituir por ManyToOne(Transaction) quando o módulo de Transações for implementado
    @Column(name = "linked_transaction_id")
    private Long linkedTransactionId;

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
    }
}
