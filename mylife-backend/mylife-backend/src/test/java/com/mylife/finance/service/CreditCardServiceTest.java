package com.mylife.finance.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.finance.domain.entity.Account;
import com.mylife.finance.domain.entity.CreditCard;
import com.mylife.finance.domain.entity.CreditCardTransaction;
import com.mylife.finance.domain.entity.Invoice;
import com.mylife.finance.domain.enums.*;
import com.mylife.finance.dto.request.CreditCardRequest;
import com.mylife.finance.dto.request.CreditCardTransactionRequest;
import com.mylife.finance.dto.request.PayInvoiceRequest;
import com.mylife.finance.dto.response.CreditCardResponse;
import com.mylife.finance.dto.response.CreditCardTransactionResponse;
import com.mylife.finance.dto.response.InvoiceResponse;
import com.mylife.finance.dto.response.TransactionResponse;
import com.mylife.finance.repository.AccountRepository;
import com.mylife.finance.repository.CreditCardRepository;
import com.mylife.finance.repository.CreditCardTransactionRepository;
import com.mylife.finance.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreditCardServiceTest {

    @Mock private CreditCardRepository creditCardRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private CreditCardTransactionRepository creditCardTransactionRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private UserRepository userRepository;
    @Mock private TransactionService transactionService;

    @InjectMocks private CreditCardService creditCardService;

    private FamilyGroup familyGroup;
    private User owner;
    private User member;
    private Account account;
    private CreditCard card;
    private Invoice invoice;

    @BeforeEach
    void setUp() {
        familyGroup = FamilyGroup.builder().id(1L).name("Família Teste").build();

        owner = User.builder()
                .id(1L).name("Proprietário").email("owner@test.com")
                .role(Role.OWNER).familyGroup(familyGroup).build();

        member = User.builder()
                .id(2L).name("Membro").email("member@test.com")
                .role(Role.MEMBER).familyGroup(familyGroup).build();

        account = Account.builder()
                .id(1L).name("Conta Corrente").bankName("Banco X")
                .type(AccountType.CHECKING).balance(new BigDecimal("5000.00"))
                .currency("BRL").owner(owner).familyGroup(familyGroup).active(true)
                .build();

        card = CreditCard.builder()
                .id(1L).name("Nubank").lastFourDigits("1234")
                .totalLimit(new BigDecimal("3000.00")).closingDay(10).dueDay(28)
                .active(true).owner(owner).familyGroup(familyGroup)
                .createdAt(LocalDateTime.now()).build();

        invoice = Invoice.builder()
                .id(1L).creditCard(card)
                .referenceMonth(YearMonth.now())
                .dueDate(LocalDate.now().withDayOfMonth(28))
                .totalAmount(new BigDecimal("500.00"))
                .status(InvoiceStatus.OPEN)
                .createdAt(LocalDateTime.now()).build();
    }

    // ── createCard ─────────────────────────────────────────────────────────────

    @Test
    void createCard_shouldSaveAndReturn() {
        CreditCardRequest request = new CreditCardRequest();
        request.setName("Nubank");
        request.setTotalLimit(new BigDecimal("3000.00"));
        request.setClosingDay(10);
        request.setDueDay(28);

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(creditCardRepository.save(any(CreditCard.class))).thenReturn(card);
        when(invoiceRepository.sumByCardAndStatusNot(card, InvoiceStatus.PAID))
                .thenReturn(BigDecimal.ZERO);
        when(invoiceRepository.findByCreditCardAndReferenceMonth(eq(card), any()))
                .thenReturn(Optional.empty());

        CreditCardResponse response = creditCardService.createCard(request, owner);

        assertThat(response.getName()).isEqualTo("Nubank");
        assertThat(response.getTotalLimit()).isEqualByComparingTo("3000.00");
        assertThat(response.getAvailableLimit()).isEqualByComparingTo("3000.00");
        verify(creditCardRepository).save(any(CreditCard.class));
    }

    // ── findAllCards ───────────────────────────────────────────────────────────

    @Test
    void findAllCards_asOwner_shouldReturnAllGroupCards() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(creditCardRepository.findByFamilyGroup(familyGroup)).thenReturn(List.of(card));
        when(invoiceRepository.sumByCardAndStatusNot(card, InvoiceStatus.PAID))
                .thenReturn(new BigDecimal("500.00"));
        when(invoiceRepository.findByCreditCardAndReferenceMonth(eq(card), any()))
                .thenReturn(Optional.of(invoice));

        List<CreditCardResponse> result = creditCardService.findAllCards(owner);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAvailableLimit()).isEqualByComparingTo("2500.00");
        assertThat(result.get(0).getCurrentInvoiceTotal()).isEqualByComparingTo("500.00");
    }

    @Test
    void findAllCards_asMember_shouldReturnOwnCards() {
        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(creditCardRepository.findByOwner(member)).thenReturn(List.of());

        List<CreditCardResponse> result = creditCardService.findAllCards(member);

        assertThat(result).isEmpty();
        verify(creditCardRepository, never()).findByFamilyGroup(any());
    }

    // ── deactivateCard ─────────────────────────────────────────────────────────

    @Test
    void deactivateCard_shouldDeactivate_whenNoUnpaidInvoices() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(creditCardRepository.findById(1L)).thenReturn(Optional.of(card));
        when(invoiceRepository.existsByCreditCardAndStatusIn(card,
                List.of(InvoiceStatus.OPEN, InvoiceStatus.CLOSED))).thenReturn(false);

        creditCardService.deactivateCard(1L, owner);

        assertThat(card.isActive()).isFalse();
        verify(creditCardRepository).save(card);
    }

    @Test
    void deactivateCard_shouldThrow_whenHasUnpaidInvoices() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(creditCardRepository.findById(1L)).thenReturn(Optional.of(card));
        when(invoiceRepository.existsByCreditCardAndStatusIn(card,
                List.of(InvoiceStatus.OPEN, InvoiceStatus.CLOSED))).thenReturn(true);

        assertThatThrownBy(() -> creditCardService.deactivateCard(1L, owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("faturas em aberto")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        verify(creditCardRepository, never()).save(any());
    }

    // ── addTransaction ─────────────────────────────────────────────────────────

    @Test
    void addTransaction_singleInstallment_shouldCreateAndUpdateInvoice() {
        CreditCardTransactionRequest request = new CreditCardTransactionRequest();
        request.setDescription("Supermercado");
        request.setTotalAmount(new BigDecimal("150.00"));
        request.setTotalInstallments(1);
        request.setCategory(TransactionCategory.FOOD);
        request.setPurchaseDate(LocalDate.now());

        CreditCardTransaction savedTx = CreditCardTransaction.builder()
                .id(1L).creditCard(card).invoice(invoice)
                .description("Supermercado").totalAmount(new BigDecimal("150.00"))
                .installmentAmount(new BigDecimal("150.00")).installmentNumber(1).totalInstallments(1)
                .category(TransactionCategory.FOOD).purchaseDate(LocalDate.now())
                .owner(owner).familyGroup(familyGroup).createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(creditCardRepository.findById(1L)).thenReturn(Optional.of(card));
        when(invoiceRepository.sumByCardAndStatusNot(card, InvoiceStatus.PAID))
                .thenReturn(new BigDecimal("500.00"));
        when(invoiceRepository.findByCreditCardAndReferenceMonth(eq(card), any()))
                .thenReturn(Optional.of(invoice));
        when(creditCardTransactionRepository.save(any(CreditCardTransaction.class))).thenReturn(savedTx);
        when(invoiceRepository.save(invoice)).thenReturn(invoice);

        CreditCardTransactionResponse response = creditCardService.addTransaction(1L, request, owner);

        assertThat(response.getInstallmentNumber()).isEqualTo(1);
        assertThat(response.getTotalInstallments()).isEqualTo(1);
        assertThat(response.isLastInstallment()).isTrue();
        assertThat(invoice.getTotalAmount()).isEqualByComparingTo("650.00");
        verify(creditCardTransactionRepository, times(1)).save(any(CreditCardTransaction.class));
    }

    @Test
    void addTransaction_threeInstallments_shouldCreateOnePerMonth() {
        CreditCardTransactionRequest request = new CreditCardTransactionRequest();
        request.setDescription("Notebook");
        request.setTotalAmount(new BigDecimal("3000.00"));
        request.setTotalInstallments(3);
        request.setCategory(TransactionCategory.HOME);
        request.setPurchaseDate(LocalDate.now());

        Invoice invoice2 = Invoice.builder().id(2L).creditCard(card)
                .referenceMonth(YearMonth.now().plusMonths(1))
                .dueDate(LocalDate.now().plusMonths(1).withDayOfMonth(28))
                .totalAmount(BigDecimal.ZERO).status(InvoiceStatus.OPEN)
                .createdAt(LocalDateTime.now()).build();

        Invoice invoice3 = Invoice.builder().id(3L).creditCard(card)
                .referenceMonth(YearMonth.now().plusMonths(2))
                .dueDate(LocalDate.now().plusMonths(2).withDayOfMonth(28))
                .totalAmount(BigDecimal.ZERO).status(InvoiceStatus.OPEN)
                .createdAt(LocalDateTime.now()).build();

        CreditCardTransaction tx1 = CreditCardTransaction.builder()
                .id(1L).creditCard(card).invoice(invoice)
                .description("Notebook").totalAmount(new BigDecimal("3000.00"))
                .installmentAmount(new BigDecimal("1000.00")).installmentNumber(1).totalInstallments(3)
                .category(TransactionCategory.HOME).purchaseDate(LocalDate.now())
                .owner(owner).familyGroup(familyGroup).createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(creditCardRepository.findById(1L)).thenReturn(Optional.of(card));
        when(invoiceRepository.sumByCardAndStatusNot(card, InvoiceStatus.PAID))
                .thenReturn(BigDecimal.ZERO);
        // Return the first invoice for the first call, then empty (creates new) for each subsequent one
        when(invoiceRepository.findByCreditCardAndReferenceMonth(eq(card), any(YearMonth.class)))
                .thenReturn(Optional.of(invoice), Optional.empty(), Optional.empty());
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));
        when(creditCardTransactionRepository.save(any(CreditCardTransaction.class))).thenReturn(tx1);

        CreditCardTransactionResponse response = creditCardService.addTransaction(1L, request, owner);

        assertThat(response.getTotalInstallments()).isEqualTo(3);
        // 3 installments → 3 saves for transactions, 3 saves for invoices
        verify(creditCardTransactionRepository, times(3)).save(any(CreditCardTransaction.class));
        verify(invoiceRepository, atLeast(3)).save(any(Invoice.class));
    }

    @Test
    void addTransaction_shouldThrow_whenInsufficientLimit() {
        CreditCardTransactionRequest request = new CreditCardTransactionRequest();
        request.setDescription("Viagem");
        request.setTotalAmount(new BigDecimal("2600.00"));
        request.setTotalInstallments(1);
        request.setCategory(TransactionCategory.LEISURE);
        request.setPurchaseDate(LocalDate.now());

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(creditCardRepository.findById(1L)).thenReturn(Optional.of(card));
        // 500 already used → available = 2500
        when(invoiceRepository.sumByCardAndStatusNot(card, InvoiceStatus.PAID))
                .thenReturn(new BigDecimal("500.00"));

        assertThatThrownBy(() -> creditCardService.addTransaction(1L, request, owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Limite insuficiente")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        verify(creditCardTransactionRepository, never()).save(any());
    }

    @Test
    void addTransaction_shouldThrow_whenCardInactive() {
        card.setActive(false);
        CreditCardTransactionRequest request = new CreditCardTransactionRequest();
        request.setDescription("Compra");
        request.setTotalAmount(new BigDecimal("100.00"));
        request.setTotalInstallments(1);
        request.setCategory(TransactionCategory.FOOD);
        request.setPurchaseDate(LocalDate.now());

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(creditCardRepository.findById(1L)).thenReturn(Optional.of(card));

        assertThatThrownBy(() -> creditCardService.addTransaction(1L, request, owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cartão inativo")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    // ── payInvoice ─────────────────────────────────────────────────────────────

    @Test
    void payInvoice_shouldCreateTransactionAndMarkPaid() {
        PayInvoiceRequest request = new PayInvoiceRequest();
        request.setAccountId(1L);
        request.setNote("Pagamento fatura maio");

        TransactionResponse txResponse = TransactionResponse.builder()
                .id(99L).type(TransactionType.EXPENSE).category(TransactionCategory.CREDIT_CARD)
                .amount(new BigDecimal("500.00")).date(LocalDate.now())
                .accountId(1L).accountName("Conta Corrente")
                .ownerId(1L).ownerName("Proprietário")
                .recurrenceType(RecurrenceType.NONE).recurrenceCurrentCount(0)
                .pending(false).createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(transactionService.create(any(), any())).thenReturn(txResponse);
        when(invoiceRepository.save(invoice)).thenReturn(invoice);
        when(creditCardTransactionRepository.findByInvoice(eq(invoice), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        InvoiceResponse response = creditCardService.payInvoice(1L, request, owner);

        assertThat(invoice.getStatus()).isEqualTo(InvoiceStatus.PAID);
        assertThat(invoice.getPaidAt()).isEqualTo(LocalDate.now());
        assertThat(invoice.getPaymentTransactionId()).isEqualTo(99L);
        verify(transactionService).create(any(), any());
        assertThat(response.getStatus()).isEqualTo(InvoiceStatus.PAID);
    }

    @Test
    void payInvoice_shouldThrow_whenAlreadyPaid() {
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDate.now().minusDays(1));

        PayInvoiceRequest request = new PayInvoiceRequest();
        request.setAccountId(1L);

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        assertThatThrownBy(() -> creditCardService.payInvoice(1L, request, owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("já foi paga")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        verify(transactionService, never()).create(any(), any());
    }

    // ── access control ─────────────────────────────────────────────────────────

    @Test
    void findCardById_shouldThrow_whenMemberAccessesOwnersCard() {
        CreditCard ownerCard = CreditCard.builder()
                .id(1L).name("Nubank").totalLimit(new BigDecimal("3000.00"))
                .closingDay(10).dueDay(28).active(true)
                .owner(owner).familyGroup(familyGroup)
                .createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(creditCardRepository.findById(1L)).thenReturn(Optional.of(ownerCard));

        assertThatThrownBy(() -> creditCardService.findCardById(1L, member))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }
}
