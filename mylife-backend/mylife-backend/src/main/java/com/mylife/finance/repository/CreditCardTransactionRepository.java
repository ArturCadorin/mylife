package com.mylife.finance.repository;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.finance.domain.entity.CreditCard;
import com.mylife.finance.domain.entity.CreditCardTransaction;
import com.mylife.finance.domain.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

public interface CreditCardTransactionRepository extends JpaRepository<CreditCardTransaction, Long> {

    Page<CreditCardTransaction> findByInvoice(Invoice invoice, Pageable pageable);

    Page<CreditCardTransaction> findByCreditCardAndInvoice(CreditCard creditCard, Invoice invoice, Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.installmentAmount), 0) FROM CreditCardTransaction t " +
           "WHERE t.invoice.id = :invoiceId")
    BigDecimal sumByInvoice(@Param("invoiceId") Long invoiceId);

    // Overview: total CC spending by invoice reference month
    @Query("SELECT COALESCE(SUM(t.installmentAmount), 0) FROM CreditCardTransaction t " +
           "WHERE t.creditCard.familyGroup = :fg AND t.invoice.referenceMonth = :month")
    BigDecimal sumByFamilyGroupAndInvoiceMonth(@Param("fg") FamilyGroup fg,
                                               @Param("month") YearMonth month);

    @Query("SELECT COALESCE(SUM(t.installmentAmount), 0) FROM CreditCardTransaction t " +
           "WHERE t.creditCard.owner = :owner AND t.invoice.referenceMonth = :month")
    BigDecimal sumByOwnerAndInvoiceMonth(@Param("owner") User owner,
                                         @Param("month") YearMonth month);

    // Delete transaction: all installments of the same purchase (identified by card + description + amount + date + total)
    @Query("SELECT t FROM CreditCardTransaction t JOIN FETCH t.invoice " +
           "WHERE t.creditCard = :card AND t.description = :desc " +
           "AND t.totalAmount = :amount AND t.purchaseDate = :date AND t.totalInstallments = :total")
    List<CreditCardTransaction> findAllInstallments(
            @Param("card") CreditCard card,
            @Param("desc") String desc,
            @Param("amount") BigDecimal amount,
            @Param("date") LocalDate date,
            @Param("total") Integer total);

    // Finance reset
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM CreditCardTransaction t WHERE t.invoice IN :invoices")
    void deleteAllByInvoiceIn(@Param("invoices") List<Invoice> invoices);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM CreditCardTransaction t WHERE t.creditCard IN :cards")
    void deleteAllByCreditCardIn(@Param("cards") List<CreditCard> cards);
}
