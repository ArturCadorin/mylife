package com.mylife.finance.repository;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.finance.domain.entity.Savings;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavingsRepository extends JpaRepository<Savings, Long> {

    Page<Savings> findByFamilyGroup(FamilyGroup familyGroup, Pageable pageable);

    Page<Savings> findByOwner(User owner, Pageable pageable);

    List<Savings> findAllByFamilyGroup(FamilyGroup familyGroup);

    List<Savings> findAllByOwner(User owner);
}
