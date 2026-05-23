package com.mylife.finance.repository;

import com.mylife.finance.domain.entity.CreditCard;
import com.mylife.finance.domain.entity.CreditCardTransaction;
import com.mylife.finance.domain.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface CreditCardTransactionRepository extends JpaRepository<CreditCardTransaction, Long> {

    Page<CreditCardTransaction> findByInvoice(Invoice invoice, Pageable pageable);

    Page<CreditCardTransaction> findByCreditCardAndInvoice(CreditCard creditCard, Invoice invoice, Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.installmentAmount), 0) FROM CreditCardTransaction t " +
           "WHERE t.invoice.id = :invoiceId")
    BigDecimal sumByInvoice(@Param("invoiceId") Long invoiceId);
}
