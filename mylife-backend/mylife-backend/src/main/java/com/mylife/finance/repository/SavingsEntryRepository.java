package com.mylife.finance.repository;

import com.mylife.finance.domain.entity.SavingsEntry;
import com.mylife.finance.domain.enums.SavingsEntryType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavingsEntryRepository extends JpaRepository<SavingsEntry, Long> {

    Page<SavingsEntry> findBySavingsId(Long savingsId, Pageable pageable);

    Page<SavingsEntry> findBySavingsIdAndType(Long savingsId, SavingsEntryType type, Pageable pageable);

    boolean existsBySavingsId(Long savingsId);
}
