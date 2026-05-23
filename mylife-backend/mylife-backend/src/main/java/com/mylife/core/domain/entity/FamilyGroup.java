package com.mylife.core.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_family_groups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ToString.Exclude
    @OneToMany(mappedBy = "familyGroup")
    @Builder.Default
    private List<User> members = new ArrayList<>();

    @PrePersist
    private void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
