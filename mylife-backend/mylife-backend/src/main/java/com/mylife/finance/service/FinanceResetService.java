package com.mylife.finance.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.finance.domain.entity.*;
import com.mylife.finance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinanceResetService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final SavingsRepository savingsRepository;
    private final SavingsEntryRepository savingsEntryRepository;
    private final InvestmentRepository investmentRepository;
    private final InvestmentEntryRepository investmentEntryRepository;
    private final CreditCardRepository creditCardRepository;
    private final InvoiceRepository invoiceRepository;
    private final CreditCardTransactionRepository creditCardTransactionRepository;
    private final RecurrencePendingNotificationRepository recurrencePendingNotificationRepository;

    @Transactional
    public void resetFinancialData(User authenticatedUser) {
        User owner = userRepository.findById(authenticatedUser.getId())
                .orElseThrow(() -> new BusinessException("Usuário não encontrado.", HttpStatus.NOT_FOUND));

        FamilyGroup familyGroup = owner.getFamilyGroup();
        if (familyGroup == null) {
            throw new BusinessException(
                    "Usuário não pertence a um grupo familiar.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }

        // 1. Recurrence pending notifications (references parentTransaction → must go first)
        recurrencePendingNotificationRepository.deleteAllByFamilyGroup(familyGroup);

        // 2. Credit card chain: transactions → invoices (bulk JPQL, evita problemas de cache JPA)
        List<CreditCard> cards = creditCardRepository.findByFamilyGroup(familyGroup);
        if (!cards.isEmpty()) {
            creditCardTransactionRepository.deleteAllByCreditCardIn(cards);
            invoiceRepository.deleteAllByCreditCardIn(cards);
        }

        // 3. Transactions (self-referential FK: clear parent refs first, then bulk delete)
        transactionRepository.clearParentTransactionRefs(familyGroup);
        transactionRepository.deleteAllByFamilyGroup(familyGroup);

        // 4. Savings entries → zero currentAmount
        List<Savings> savingsList = savingsRepository.findAllByFamilyGroup(familyGroup);
        if (!savingsList.isEmpty()) {
            savingsEntryRepository.deleteAllBySavingsIn(savingsList);
            savingsList.forEach(s -> s.setCurrentAmount(BigDecimal.ZERO));
            savingsRepository.saveAll(savingsList);
        }

        // 5. Investment entries → zero totalInvested + currentValue
        List<Investment> investments = investmentRepository.findByFamilyGroupAndActiveTrue(familyGroup);
        if (!investments.isEmpty()) {
            investmentEntryRepository.deleteAllByInvestmentIn(investments);
            investments.forEach(i -> {
                i.setTotalInvested(BigDecimal.ZERO);
                i.setCurrentValue(BigDecimal.ZERO);
            });
            investmentRepository.saveAll(investments);
        }

        // 6. Zero account balances (keep accounts intact)
        List<Account> accounts = accountRepository.findAllByFamilyGroupAndActiveTrue(familyGroup);
        accounts.forEach(a -> a.setBalance(BigDecimal.ZERO));
        accountRepository.saveAll(accounts);
    }
}
