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
import com.mylife.finance.domain.enums.InvoiceStatus;
import com.mylife.finance.domain.enums.TransactionCategory;
import com.mylife.finance.domain.enums.TransactionType;
import com.mylife.finance.dto.request.CreditCardRequest;
import com.mylife.finance.dto.request.CreditCardTransactionRequest;
import com.mylife.finance.dto.request.PayInvoiceRequest;
import com.mylife.finance.dto.request.TransactionRequest;
import com.mylife.finance.dto.response.CreditCardResponse;
import com.mylife.finance.dto.response.CreditCardTransactionResponse;
import com.mylife.finance.dto.response.InvoiceResponse;
import com.mylife.finance.dto.response.TransactionResponse;
import com.mylife.finance.repository.AccountRepository;
import com.mylife.finance.repository.CreditCardRepository;
import com.mylife.finance.repository.CreditCardTransactionRepository;
import com.mylife.finance.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CreditCardService {

    private static final DateTimeFormatter YEAR_MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final CreditCardRepository creditCardRepository;
    private final InvoiceRepository invoiceRepository;
    private final CreditCardTransactionRepository creditCardTransactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransactionService transactionService;

    // ── Card CRUD ──────────────────────────────────────────────────────────────

    @Transactional
    public CreditCardResponse createCard(CreditCardRequest request, User authenticatedUser) {
        User owner = reloadUser(authenticatedUser);
        FamilyGroup familyGroup = requireFamilyGroup(owner);
        Account linkedAccount = resolveLinkedAccount(request.getLinkedAccountId(), familyGroup);

        CreditCard card = CreditCard.builder()
                .name(request.getName())
                .bankName(request.getBankName())
                .color(request.getColor())
                .lastFourDigits(request.getLastFourDigits())
                .totalLimit(request.getTotalLimit())
                .closingDay(request.getClosingDay())
                .dueDay(request.getDueDay())
                .linkedAccount(linkedAccount)
                .owner(owner)
                .familyGroup(familyGroup)
                .build();

        return toCardResponse(creditCardRepository.save(card));
    }

    @Transactional(readOnly = true)
    public List<CreditCardResponse> findAllCards(User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup familyGroup = requireFamilyGroup(user);

        List<CreditCard> cards = user.getRole() == Role.OWNER
                ? creditCardRepository.findByFamilyGroup(familyGroup)
                : creditCardRepository.findByOwner(user);

        return cards.stream().map(this::toCardResponse).toList();
    }

    @Transactional(readOnly = true)
    public CreditCardResponse findCardById(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        CreditCard card = findCardOrThrow(id);
        validateCardAccess(user, card);
        return toCardResponse(card);
    }

    @Transactional
    public CreditCardResponse updateCard(Long id, CreditCardRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        CreditCard card = findCardOrThrow(id);
        validateCardAccess(user, card);

        FamilyGroup familyGroup = requireFamilyGroup(user);
        Account linkedAccount = resolveLinkedAccount(request.getLinkedAccountId(), familyGroup);

        card.setName(request.getName());
        card.setBankName(request.getBankName());
        card.setColor(request.getColor());
        card.setLastFourDigits(request.getLastFourDigits());
        card.setTotalLimit(request.getTotalLimit());
        card.setClosingDay(request.getClosingDay());
        card.setDueDay(request.getDueDay());
        card.setLinkedAccount(linkedAccount);

        return toCardResponse(creditCardRepository.save(card));
    }

    @Transactional
    public void deactivateCard(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        CreditCard card = findCardOrThrow(id);
        validateCardAccess(user, card);

        boolean hasUnpaidInvoices = invoiceRepository.existsByCreditCardAndStatusIn(
                card, List.of(InvoiceStatus.OPEN, InvoiceStatus.CLOSED));
        if (hasUnpaidInvoices) {
            throw new BusinessException(
                    "Não é possível desativar o cartão com faturas em aberto ou fechadas.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }

        card.setActive(false);
        creditCardRepository.save(card);
    }

    // ── Transactions ───────────────────────────────────────────────────────────

    @Transactional
    public CreditCardTransactionResponse addTransaction(Long cardId,
                                                        CreditCardTransactionRequest request,
                                                        User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup familyGroup = requireFamilyGroup(user);
        CreditCard card = findCardOrThrow(cardId);
        validateCardAccess(user, card);

        if (!card.isActive()) {
            throw new BusinessException("Cartão inativo.", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        BigDecimal usedLimit = invoiceRepository.sumByCardAndStatusNot(card, InvoiceStatus.PAID);
        BigDecimal available = card.getTotalLimit().subtract(usedLimit);
        if (request.getTotalAmount().compareTo(available) > 0) {
            throw new BusinessException(
                    String.format("Limite insuficiente. Disponível: R$ %.2f.", available),
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }

        // Base invoice month derived from purchase date:
        // purchaseDate <= closingDay → same month, else next month
        LocalDate purchaseDate = request.getPurchaseDate();
        YearMonth baseMonth = purchaseDate.getDayOfMonth() <= card.getClosingDay()
                ? YearMonth.from(purchaseDate)
                : YearMonth.from(purchaseDate).plusMonths(1);

        int n = request.getTotalInstallments();
        BigDecimal installmentAmount = request.getTotalAmount()
                .divide(BigDecimal.valueOf(n), 2, RoundingMode.DOWN);
        BigDecimal lastInstallmentAmount = request.getTotalAmount()
                .subtract(installmentAmount.multiply(BigDecimal.valueOf(n - 1)));

        CreditCardTransaction first = null;

        for (int i = 0; i < n; i++) {
            YearMonth invoiceMonth = baseMonth.plusMonths(i);
            Invoice invoice = getOrCreateInvoice(card, invoiceMonth);

            BigDecimal amount = (i == n - 1) ? lastInstallmentAmount : installmentAmount;

            CreditCardTransaction tx = CreditCardTransaction.builder()
                    .creditCard(card)
                    .invoice(invoice)
                    .description(request.getDescription())
                    .totalAmount(request.getTotalAmount())
                    .installmentAmount(amount)
                    .installmentNumber(i + 1)
                    .totalInstallments(n)
                    .category(request.getCategory())
                    .purchaseDate(request.getPurchaseDate())
                    .note(request.getNote())
                    .owner(user)
                    .familyGroup(familyGroup)
                    .build();

            CreditCardTransaction saved = creditCardTransactionRepository.save(tx);
            if (i == 0) first = saved;

            invoice.setTotalAmount(invoice.getTotalAmount().add(amount));
            invoiceRepository.save(invoice);
        }

        return toTransactionResponse(first);
    }

    @Transactional
    public void deleteTransaction(Long cardId, Long transactionId, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        CreditCard card = findCardOrThrow(cardId);
        validateCardAccess(user, card);

        CreditCardTransaction tx = creditCardTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new BusinessException("Transação não encontrada.", HttpStatus.NOT_FOUND));

        if (!tx.getCreditCard().getId().equals(cardId)) {
            throw new BusinessException("Transação não pertence a este cartão.", HttpStatus.FORBIDDEN);
        }

        if (tx.getInvoice().getStatus() == InvoiceStatus.PAID) {
            throw new BusinessException(
                    "Não é possível excluir lançamentos de faturas já pagas.", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        // Find all installments of this purchase (same card, description, amount, date, total)
        List<CreditCardTransaction> allInstallments = creditCardTransactionRepository
                .findAllInstallments(card, tx.getDescription(), tx.getTotalAmount(),
                        tx.getPurchaseDate(), tx.getTotalInstallments());

        // Only delete installments in non-PAID invoices
        List<CreditCardTransaction> toDelete = allInstallments.stream()
                .filter(t -> t.getInvoice().getStatus() != InvoiceStatus.PAID)
                .toList();

        // Accumulate invoice total deductions per invoice
        Map<Long, Invoice> invoiceMap = new LinkedHashMap<>();
        for (CreditCardTransaction t : toDelete) {
            Invoice inv = t.getInvoice();
            invoiceMap.putIfAbsent(inv.getId(), inv);
            inv.setTotalAmount(inv.getTotalAmount().subtract(t.getInstallmentAmount()));
        }

        creditCardTransactionRepository.deleteAll(toDelete);

        // Persist updated totals or delete invoices that became empty
        for (Invoice inv : invoiceMap.values()) {
            if (inv.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
                invoiceRepository.delete(inv);
            } else {
                invoiceRepository.save(inv);
            }
        }
    }

    // ── Invoices ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<InvoiceResponse> findInvoices(Long cardId, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        CreditCard card = findCardOrThrow(cardId);
        validateCardAccess(user, card);
        return invoiceRepository.findByCreditCardOrderByReferenceMonthDesc(card)
                .stream()
                .map(inv -> toInvoiceResponse(inv, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse findInvoiceByMonth(Long cardId, String yearMonthStr, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        CreditCard card = findCardOrThrow(cardId);
        validateCardAccess(user, card);

        YearMonth month = parseYearMonth(yearMonthStr);
        Invoice invoice = invoiceRepository.findByCreditCardAndReferenceMonth(card, month)
                .orElseThrow(() -> new BusinessException(
                        "Fatura não encontrada para o mês " + yearMonthStr + ".", HttpStatus.NOT_FOUND));

        return toInvoiceResponse(invoice, true);
    }

    @Transactional
    public InvoiceResponse payInvoice(Long invoiceId, PayInvoiceRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new BusinessException("Fatura não encontrada.", HttpStatus.NOT_FOUND));
        validateCardAccess(user, invoice.getCreditCard());

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessException("Fatura já foi paga.", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        TransactionRequest txRequest = new TransactionRequest();
        txRequest.setType(TransactionType.EXPENSE);
        txRequest.setCategory(TransactionCategory.CREDIT_CARD);
        txRequest.setAmount(invoice.getTotalAmount());
        txRequest.setDate(LocalDate.now());
        txRequest.setAccountId(request.getAccountId());
        txRequest.setDescription("Pagamento fatura: " + invoice.getCreditCard().getName()
                + " (" + invoice.getReferenceMonth().format(YEAR_MONTH_FMT) + ")");
        txRequest.setNote(request.getNote());

        TransactionResponse tx = transactionService.create(txRequest, authenticatedUser);

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDate.now());
        invoice.setPaymentTransactionId(tx.getId());
        invoice = invoiceRepository.save(invoice);

        return toInvoiceResponse(invoice, true);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private Invoice getOrCreateInvoice(CreditCard card, YearMonth month) {
        return invoiceRepository.findByCreditCardAndReferenceMonth(card, month)
                .orElseGet(() -> {
                    LocalDate dueDate = month.atDay(Math.min(card.getDueDay(), month.lengthOfMonth()));
                    Invoice inv = Invoice.builder()
                            .creditCard(card)
                            .referenceMonth(month)
                            .dueDate(dueDate)
                            .totalAmount(BigDecimal.ZERO)
                            .status(InvoiceStatus.OPEN)
                            .build();
                    return invoiceRepository.save(inv);
                });
    }

    private YearMonth currentBillingMonth(CreditCard card) {
        LocalDate today = LocalDate.now();
        return today.getDayOfMonth() <= card.getClosingDay()
                ? YearMonth.from(today)
                : YearMonth.from(today).plusMonths(1);
    }

    private CreditCardResponse toCardResponse(CreditCard card) {
        BigDecimal usedLimit = invoiceRepository.sumByCardAndStatusNot(card, InvoiceStatus.PAID);
        BigDecimal availableLimit = card.getTotalLimit().subtract(usedLimit);

        YearMonth currentMonth = currentBillingMonth(card);
        BigDecimal currentInvoiceTotal = invoiceRepository
                .findByCreditCardAndReferenceMonth(card, currentMonth)
                .map(Invoice::getTotalAmount)
                .orElse(BigDecimal.ZERO);

        return CreditCardResponse.builder()
                .id(card.getId())
                .name(card.getName())
                .bankName(card.getBankName())
                .color(card.getColor())
                .lastFourDigits(card.getLastFourDigits())
                .totalLimit(card.getTotalLimit())
                .availableLimit(availableLimit)
                .currentInvoiceTotal(currentInvoiceTotal)
                .closingDay(card.getClosingDay())
                .dueDay(card.getDueDay())
                .linkedAccountId(card.getLinkedAccount() != null ? card.getLinkedAccount().getId() : null)
                .linkedAccountName(card.getLinkedAccount() != null ? card.getLinkedAccount().getName() : null)
                .active(card.isActive())
                .ownerId(card.getOwner().getId())
                .ownerName(card.getOwner().getName())
                .createdAt(card.getCreatedAt())
                .build();
    }

    private InvoiceResponse toInvoiceResponse(Invoice invoice, boolean includeTransactions) {
        List<CreditCardTransactionResponse> transactions = includeTransactions
                ? creditCardTransactionRepository
                        .findByInvoice(invoice, Pageable.unpaged())
                        .map(this::toTransactionResponse)
                        .toList()
                : List.of();

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .creditCardId(invoice.getCreditCard().getId())
                .creditCardName(invoice.getCreditCard().getName())
                .yearMonth(invoice.getReferenceMonth().format(YEAR_MONTH_FMT))
                .dueDate(invoice.getDueDate())
                .totalAmount(invoice.getTotalAmount())
                .status(invoice.getStatus())
                .paidAt(invoice.getPaidAt())
                .paymentTransactionId(invoice.getPaymentTransactionId())
                .transactions(transactions)
                .createdAt(invoice.getCreatedAt())
                .build();
    }

    private CreditCardTransactionResponse toTransactionResponse(CreditCardTransaction tx) {
        return CreditCardTransactionResponse.builder()
                .id(tx.getId())
                .creditCardId(tx.getCreditCard().getId())
                .creditCardName(tx.getCreditCard().getName())
                .invoiceId(tx.getInvoice().getId())
                .invoiceReferenceMonth(tx.getInvoice().getReferenceMonth().format(YEAR_MONTH_FMT))
                .description(tx.getDescription())
                .totalAmount(tx.getTotalAmount())
                .installmentAmount(tx.getInstallmentAmount())
                .installmentNumber(tx.getInstallmentNumber())
                .totalInstallments(tx.getTotalInstallments())
                .category(tx.getCategory())
                .purchaseDate(tx.getPurchaseDate())
                .note(tx.getNote())
                .lastInstallment(tx.getInstallmentNumber().equals(tx.getTotalInstallments()))
                .ownerId(tx.getOwner().getId())
                .ownerName(tx.getOwner().getName())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    private User reloadUser(User authenticatedUser) {
        return userRepository.findById(authenticatedUser.getId())
                .orElseThrow(() -> new BusinessException("Usuário não encontrado.", HttpStatus.NOT_FOUND));
    }

    private FamilyGroup requireFamilyGroup(User user) {
        FamilyGroup fg = user.getFamilyGroup();
        if (fg == null) {
            throw new BusinessException(
                    "Usuário não pertence a um grupo familiar.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }
        return fg;
    }

    private CreditCard findCardOrThrow(Long id) {
        return creditCardRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Cartão não encontrado.", HttpStatus.NOT_FOUND));
    }

    private void validateCardAccess(User user, CreditCard card) {
        FamilyGroup familyGroup = requireFamilyGroup(user);
        if (!card.getFamilyGroup().getId().equals(familyGroup.getId())) {
            throw new BusinessException("Acesso negado a este cartão.", HttpStatus.FORBIDDEN);
        }
        if (user.getRole() == Role.MEMBER && !card.getOwner().getId().equals(user.getId())) {
            throw new BusinessException("Acesso negado a este cartão.", HttpStatus.FORBIDDEN);
        }
    }

    private Account resolveLinkedAccount(Long accountId, FamilyGroup familyGroup) {
        if (accountId == null) return null;
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new BusinessException("Conta vinculada não encontrada.", HttpStatus.NOT_FOUND));
        if (!account.getFamilyGroup().getId().equals(familyGroup.getId())) {
            throw new BusinessException("Conta vinculada não pertence ao grupo familiar.", HttpStatus.FORBIDDEN);
        }
        return account;
    }

    private YearMonth parseYearMonth(String value) {
        try {
            return YearMonth.parse(value, YEAR_MONTH_FMT);
        } catch (DateTimeParseException e) {
            throw new BusinessException(
                    "Mês inválido: " + value + ". Use o formato yyyy-MM (ex: 2026-05).",
                    HttpStatus.BAD_REQUEST);
        }
    }
}
