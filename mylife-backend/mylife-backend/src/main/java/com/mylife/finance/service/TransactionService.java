package com.mylife.finance.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.finance.domain.entity.Account;
import com.mylife.finance.domain.entity.RecurrencePendingNotification;
import com.mylife.finance.domain.entity.Transaction;
import com.mylife.finance.domain.enums.RecurrenceFrequency;
import com.mylife.finance.domain.enums.RecurrenceType;
import com.mylife.finance.domain.enums.TransactionType;
import com.mylife.finance.dto.request.ConfirmRecurrenceRequest;
import com.mylife.finance.dto.request.TransactionRequest;
import com.mylife.finance.dto.request.TransactionUpdateRequest;
import com.mylife.finance.dto.response.RecurrencePendingResponse;
import com.mylife.finance.dto.response.TransactionResponse;
import com.mylife.finance.repository.AccountRepository;
import com.mylife.finance.repository.RecurrencePendingNotificationRepository;
import com.mylife.finance.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final RecurrencePendingNotificationRepository notificationRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional
    public TransactionResponse create(TransactionRequest request, User authenticatedUser) {
        User owner = reloadUser(authenticatedUser);
        FamilyGroup familyGroup = requireFamilyGroup(owner);
        Account account = resolveAccount(request.getAccountId(), familyGroup, owner);

        RecurrenceType recurrenceType = request.getRecurrenceType() != null
                ? request.getRecurrenceType() : RecurrenceType.NONE;
        validateRecurrenceFields(recurrenceType, request.getRecurrenceFrequency());

        Transaction transaction = Transaction.builder()
                .account(account)
                .owner(owner)
                .familyGroup(familyGroup)
                .type(request.getType())
                .category(request.getCategory())
                .amount(request.getAmount())
                .date(request.getDate())
                .description(request.getDescription())
                .note(request.getNote())
                .recurrenceType(recurrenceType)
                .recurrenceFrequency(request.getRecurrenceFrequency())
                .recurrenceTotalCount(request.getRecurrenceTotalCount())
                .recurrenceCurrentCount(0)
                .nextOccurrenceDate(recurrenceType != RecurrenceType.NONE ? request.getDate() : null)
                .build();

        transaction = transactionRepository.save(transaction);

        // Recurring parent transactions don't affect balance — only their confirmed children do
        if (recurrenceType == RecurrenceType.NONE) {
            applyBalanceChange(account, transaction.getType(), transaction.getAmount());
            accountRepository.save(account);
        }

        return toResponse(transaction);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> findAll(User authenticatedUser, TransactionType type, Long accountId, Pageable pageable) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup familyGroup = requireFamilyGroup(user);
        Account account = accountId != null ? resolveAccount(accountId, familyGroup, user) : null;

        if (user.getRole() == Role.OWNER) {
            if (type != null && account != null)
                return transactionRepository.findByFamilyGroupAndTypeAndAccount(familyGroup, type, account, pageable).map(this::toResponse);
            if (type != null)
                return transactionRepository.findByFamilyGroupAndType(familyGroup, type, pageable).map(this::toResponse);
            if (account != null)
                return transactionRepository.findByFamilyGroupAndAccount(familyGroup, account, pageable).map(this::toResponse);
            return transactionRepository.findByFamilyGroup(familyGroup, pageable).map(this::toResponse);
        }

        if (type != null && account != null)
            return transactionRepository.findByOwnerAndTypeAndAccount(user, type, account, pageable).map(this::toResponse);
        if (type != null)
            return transactionRepository.findByOwnerAndType(user, type, pageable).map(this::toResponse);
        if (account != null)
            return transactionRepository.findByOwnerAndAccount(user, account, pageable).map(this::toResponse);
        return transactionRepository.findByOwner(user, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public TransactionResponse findById(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Transaction transaction = findOrThrow(id);
        validateAccess(user, transaction);
        return toResponse(transaction);
    }

    @Transactional
    public TransactionResponse update(Long id, TransactionUpdateRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Transaction transaction = findOrThrow(id);
        validateAccess(user, transaction);

        if (transaction.getRecurrenceType() != RecurrenceType.NONE && transaction.getParentTransaction() == null) {
            throw new BusinessException(
                    "Não é possível editar uma transação recorrente ativa. Exclua e recrie para alterar as configurações.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }

        FamilyGroup familyGroup = requireFamilyGroup(user);
        Account newAccount = resolveAccount(request.getAccountId(), familyGroup, user);

        // Revert old balance effect (non-recurring or child transactions only)
        boolean affectsBalance = transaction.getRecurrenceType() == RecurrenceType.NONE
                || transaction.getParentTransaction() != null;
        if (affectsBalance && !transaction.isPending()) {
            Account oldAccount = transaction.getAccount();
            revertBalanceChange(oldAccount, transaction.getType(), transaction.getAmount());
            accountRepository.save(oldAccount);
        }

        transaction.setType(request.getType());
        transaction.setCategory(request.getCategory());
        transaction.setAmount(request.getAmount());
        transaction.setDate(request.getDate());
        transaction.setDescription(request.getDescription());
        transaction.setNote(request.getNote());
        transaction.setAccount(newAccount);

        transaction = transactionRepository.save(transaction);

        if (affectsBalance && !transaction.isPending()) {
            applyBalanceChange(newAccount, transaction.getType(), transaction.getAmount());
            accountRepository.save(newAccount);
        }

        return toResponse(transaction);
    }

    @Transactional
    public void delete(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Transaction transaction = findOrThrow(id);
        validateAccess(user, transaction);

        boolean affectsBalance = transaction.getRecurrenceType() == RecurrenceType.NONE
                || transaction.getParentTransaction() != null;
        if (affectsBalance && !transaction.isPending()) {
            Account account = transaction.getAccount();
            revertBalanceChange(account, transaction.getType(), transaction.getAmount());
            accountRepository.save(account);
        }

        transactionRepository.delete(transaction);
    }

    @Transactional(readOnly = true)
    public Page<RecurrencePendingResponse> findPendingNotifications(User authenticatedUser, Pageable pageable) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup familyGroup = requireFamilyGroup(user);

        if (user.getRole() == Role.OWNER)
            return notificationRepository.findByFamilyGroupAndConfirmedFalse(familyGroup, pageable).map(this::toNotificationResponse);
        return notificationRepository.findByOwnerAndConfirmedFalse(user, pageable).map(this::toNotificationResponse);
    }

    @Transactional
    public TransactionResponse confirmRecurrence(Long notificationId, ConfirmRecurrenceRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup familyGroup = requireFamilyGroup(user);

        RecurrencePendingNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException("Notificação não encontrada.", HttpStatus.NOT_FOUND));
        validateNotificationAccess(user, notification);

        if (notification.isConfirmed()) {
            throw new BusinessException("Esta notificação já foi confirmada.", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        Transaction parent = notification.getParentTransaction();

        Account account = request.getAccountId() != null
                ? resolveAccount(request.getAccountId(), familyGroup, user)
                : parent.getAccount();
        BigDecimal amount = request.getAmount() != null ? request.getAmount() : parent.getAmount();
        LocalDate date = request.getDate() != null ? request.getDate() : notification.getScheduledDate();

        Transaction child = Transaction.builder()
                .account(account)
                .owner(parent.getOwner())
                .familyGroup(parent.getFamilyGroup())
                .type(parent.getType())
                .category(parent.getCategory())
                .amount(amount)
                .date(date)
                .description(parent.getDescription())
                .note(request.getNote() != null ? request.getNote() : parent.getNote())
                .recurrenceType(RecurrenceType.NONE)
                .parentTransaction(parent)
                .pending(false)
                .build();

        child = transactionRepository.save(child);

        applyBalanceChange(account, child.getType(), child.getAmount());
        accountRepository.save(account);

        parent.setRecurrenceCurrentCount(parent.getRecurrenceCurrentCount() + 1);
        transactionRepository.save(parent);

        notification.setConfirmed(true);
        notification.setConfirmedAt(LocalDateTime.now());
        notification.setGeneratedTransactionId(child.getId());
        notificationRepository.save(notification);

        return toResponse(child);
    }

    // --- Package-private: used by RecurrenceSchedulerService ---

    @Transactional
    public void processRecurringParent(Long parentId) {
        Transaction parent = findOrThrow(parentId);
        LocalDate occurrenceDate = parent.getNextOccurrenceDate();

        boolean hasLimit = parent.getRecurrenceTotalCount() != null;
        if (hasLimit && parent.getRecurrenceCurrentCount() >= parent.getRecurrenceTotalCount()) {
            parent.setNextOccurrenceDate(null);
            transactionRepository.save(parent);
            return;
        }

        if (parent.getRecurrenceType() == RecurrenceType.AUTOMATIC) {
            Transaction child = Transaction.builder()
                    .account(parent.getAccount())
                    .owner(parent.getOwner())
                    .familyGroup(parent.getFamilyGroup())
                    .type(parent.getType())
                    .category(parent.getCategory())
                    .amount(parent.getAmount())
                    .date(occurrenceDate)
                    .description(parent.getDescription())
                    .note(parent.getNote())
                    .recurrenceType(RecurrenceType.NONE)
                    .parentTransaction(parent)
                    .build();
            transactionRepository.save(child);

            applyBalanceChange(parent.getAccount(), parent.getType(), parent.getAmount());
            accountRepository.save(parent.getAccount());

            parent.setRecurrenceCurrentCount(parent.getRecurrenceCurrentCount() + 1);
        } else {
            RecurrencePendingNotification notification = RecurrencePendingNotification.builder()
                    .parentTransaction(parent)
                    .scheduledDate(occurrenceDate)
                    .owner(parent.getOwner())
                    .familyGroup(parent.getFamilyGroup())
                    .build();
            notificationRepository.save(notification);
        }

        parent.setNextOccurrenceDate(nextDate(occurrenceDate, parent.getRecurrenceFrequency()));
        transactionRepository.save(parent);
    }

    List<Long> findDueRecurringTransactionIds(LocalDate date) {
        return transactionRepository.findDueRecurringTransactionIds(
                List.of(RecurrenceType.AUTOMATIC, RecurrenceType.MANUAL), date);
    }

    // --- Helpers ---

    private void applyBalanceChange(Account account, TransactionType type, BigDecimal amount) {
        if (type == TransactionType.INCOME) {
            account.setBalance(account.getBalance().add(amount));
        } else {
            account.setBalance(account.getBalance().subtract(amount));
        }
    }

    private void revertBalanceChange(Account account, TransactionType type, BigDecimal amount) {
        if (type == TransactionType.INCOME) {
            account.setBalance(account.getBalance().subtract(amount));
        } else {
            account.setBalance(account.getBalance().add(amount));
        }
    }

    private LocalDate nextDate(LocalDate from, RecurrenceFrequency frequency) {
        return switch (frequency) {
            case DAILY -> from.plusDays(1);
            case WEEKLY -> from.plusWeeks(1);
            case MONTHLY -> from.plusMonths(1);
            case YEARLY -> from.plusYears(1);
        };
    }

    private void validateRecurrenceFields(RecurrenceType type, RecurrenceFrequency frequency) {
        if (type != RecurrenceType.NONE && frequency == null) {
            throw new BusinessException(
                    "Frequência de recorrência é obrigatória para transações recorrentes.",
                    HttpStatus.BAD_REQUEST);
        }
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

    private Account resolveAccount(Long accountId, FamilyGroup familyGroup, User user) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new BusinessException("Conta não encontrada.", HttpStatus.NOT_FOUND));
        if (!account.getFamilyGroup().getId().equals(familyGroup.getId())) {
            throw new BusinessException("Conta não pertence ao grupo familiar.", HttpStatus.FORBIDDEN);
        }
        if (!account.isActive()) {
            throw new BusinessException("Conta inativa. Reative a conta antes de lançar transações.", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        if (user.getRole() == Role.MEMBER && !account.getOwner().getId().equals(user.getId())) {
            throw new BusinessException("Acesso negado a esta conta.", HttpStatus.FORBIDDEN);
        }
        return account;
    }

    private Transaction findOrThrow(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Transação não encontrada.", HttpStatus.NOT_FOUND));
    }

    private void validateAccess(User user, Transaction transaction) {
        FamilyGroup familyGroup = requireFamilyGroup(user);
        if (!transaction.getFamilyGroup().getId().equals(familyGroup.getId())) {
            throw new BusinessException("Acesso negado a esta transação.", HttpStatus.FORBIDDEN);
        }
        if (user.getRole() == Role.MEMBER && !transaction.getOwner().getId().equals(user.getId())) {
            throw new BusinessException("Acesso negado a esta transação.", HttpStatus.FORBIDDEN);
        }
    }

    private void validateNotificationAccess(User user, RecurrencePendingNotification notification) {
        FamilyGroup familyGroup = requireFamilyGroup(user);
        if (!notification.getFamilyGroup().getId().equals(familyGroup.getId())) {
            throw new BusinessException("Acesso negado a esta notificação.", HttpStatus.FORBIDDEN);
        }
        if (user.getRole() == Role.MEMBER && !notification.getOwner().getId().equals(user.getId())) {
            throw new BusinessException("Acesso negado a esta notificação.", HttpStatus.FORBIDDEN);
        }
    }

    private TransactionResponse toResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .type(t.getType())
                .category(t.getCategory())
                .amount(t.getAmount())
                .date(t.getDate())
                .description(t.getDescription())
                .note(t.getNote())
                .accountId(t.getAccount().getId())
                .accountName(t.getAccount().getName())
                .ownerId(t.getOwner().getId())
                .ownerName(t.getOwner().getName())
                .recurrenceType(t.getRecurrenceType())
                .recurrenceFrequency(t.getRecurrenceFrequency())
                .recurrenceTotalCount(t.getRecurrenceTotalCount())
                .recurrenceCurrentCount(t.getRecurrenceCurrentCount())
                .nextOccurrenceDate(t.getNextOccurrenceDate())
                .parentTransactionId(t.getParentTransaction() != null ? t.getParentTransaction().getId() : null)
                .pending(t.isPending())
                .createdAt(t.getCreatedAt())
                .build();
    }

    private RecurrencePendingResponse toNotificationResponse(RecurrencePendingNotification n) {
        Transaction parent = n.getParentTransaction();
        return RecurrencePendingResponse.builder()
                .id(n.getId())
                .parentTransactionId(parent.getId())
                .parentTransactionDescription(parent.getDescription())
                .type(parent.getType())
                .category(parent.getCategory())
                .amount(parent.getAmount())
                .scheduledDate(n.getScheduledDate())
                .accountId(parent.getAccount().getId())
                .accountName(parent.getAccount().getName())
                .ownerId(n.getOwner().getId())
                .ownerName(n.getOwner().getName())
                .confirmed(n.isConfirmed())
                .confirmedAt(n.getConfirmedAt())
                .generatedTransactionId(n.getGeneratedTransactionId())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
