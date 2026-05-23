package com.mylife.finance.repository;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.finance.domain.entity.CreditCard;
import com.mylife.finance.domain.entity.Invoice;
import com.mylife.finance.domain.enums.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByCreditCardAndReferenceMonth(CreditCard creditCard, YearMonth referenceMonth);

    Page<Invoice> findByCreditCardAndStatus(CreditCard creditCard, InvoiceStatus status, Pageable pageable);

    Page<Invoice> findByCreditCard(CreditCard creditCard, Pageable pageable);

    boolean existsByCreditCardAndStatusIn(CreditCard creditCard, List<InvoiceStatus> statuses);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
           "WHERE i.creditCard = :card AND i.status <> :status")
    BigDecimal sumByCardAndStatusNot(@Param("card") CreditCard card,
                                     @Param("status") InvoiceStatus status);

    // Reports: total credit card debt for the overview
    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
           "WHERE i.creditCard.familyGroup = :fg AND i.status IN :statuses")
    BigDecimal sumDebtByFamilyGroupAndStatuses(@Param("fg") FamilyGroup fg,
                                               @Param("statuses") List<InvoiceStatus> statuses);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
           "WHERE i.creditCard.owner = :owner AND i.status IN :statuses")
    BigDecimal sumDebtByOwnerAndStatuses(@Param("owner") User owner,
                                         @Param("statuses") List<InvoiceStatus> statuses);
}
