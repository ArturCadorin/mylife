package com.mylife.finance.repository;

import com.mylife.finance.domain.entity.Investment;
import com.mylife.finance.domain.entity.InvestmentEntry;
import com.mylife.finance.domain.enums.InvestmentEntryType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InvestmentEntryRepository extends JpaRepository<InvestmentEntry, Long> {

    Page<InvestmentEntry> findByInvestmentId(Long investmentId, Pageable pageable);

    Page<InvestmentEntry> findByInvestmentIdAndType(Long investmentId, InvestmentEntryType type, Pageable pageable);

    // Finance reset
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM InvestmentEntry e WHERE e.investment IN :investments")
    void deleteAllByInvestmentIn(@Param("investments") List<Investment> investments);
}
