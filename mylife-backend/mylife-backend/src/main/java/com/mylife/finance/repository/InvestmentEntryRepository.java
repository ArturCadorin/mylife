package com.mylife.finance.repository;

import com.mylife.finance.domain.entity.InvestmentEntry;
import com.mylife.finance.domain.enums.InvestmentEntryType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvestmentEntryRepository extends JpaRepository<InvestmentEntry, Long> {

    Page<InvestmentEntry> findByInvestmentId(Long investmentId, Pageable pageable);

    Page<InvestmentEntry> findByInvestmentIdAndType(Long investmentId, InvestmentEntryType type, Pageable pageable);
}
