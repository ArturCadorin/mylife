package com.mylife.finance.repository;

import com.mylife.finance.domain.entity.Savings;
import com.mylife.finance.domain.entity.SavingsEntry;
import com.mylife.finance.domain.enums.SavingsEntryType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SavingsEntryRepository extends JpaRepository<SavingsEntry, Long> {

    Page<SavingsEntry> findBySavingsId(Long savingsId, Pageable pageable);

    Page<SavingsEntry> findBySavingsIdAndType(Long savingsId, SavingsEntryType type, Pageable pageable);

    boolean existsBySavingsId(Long savingsId);

    // Finance reset
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM SavingsEntry e WHERE e.savings IN :savingsList")
    void deleteAllBySavingsIn(@Param("savingsList") List<Savings> savingsList);
}
