package com.mylife.finance.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.finance.domain.entity.Account;
import com.mylife.finance.domain.entity.Investment;
import com.mylife.finance.domain.entity.InvestmentEntry;
import com.mylife.finance.domain.enums.InvestmentEntryType;
import com.mylife.finance.domain.enums.InvestmentType;
import com.mylife.finance.dto.request.InvestmentEntryRequest;
import com.mylife.finance.dto.request.InvestmentRequest;
import com.mylife.finance.dto.request.InvestmentUpdateRequest;
import com.mylife.finance.dto.response.InvestmentEntryResponse;
import com.mylife.finance.dto.response.InvestmentResponse;
import com.mylife.finance.dto.response.report.InvestmentSummaryResponse;
import com.mylife.finance.repository.AccountRepository;
import com.mylife.finance.repository.InvestmentEntryRepository;
import com.mylife.finance.repository.InvestmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InvestmentService {

    private final InvestmentRepository investmentRepository;
    private final InvestmentEntryRepository investmentEntryRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @Transactional
    public InvestmentResponse create(InvestmentRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup fg = requireFamilyGroup(user);
        Account linkedAccount = resolveLinkedAccount(request.getLinkedAccountId(), fg);

        Investment investment = Investment.builder()
                .name(request.getName())
                .type(request.getType())
                .institution(request.getInstitution())
                .totalInvested(request.getInitialAmount())
                .currentValue(request.getInitialAmount())
                .indexer(request.getIndexer())
                .indexerRate(request.getIndexerRate())
                .fixedRate(request.getFixedRate())
                .currentIndexValue(request.getCurrentIndexValue())
                .maturityDate(request.getMaturityDate())
                .linkedAccount(linkedAccount)
                .owner(user)
                .familyGroup(fg)
                .build();

        investment = investmentRepository.save(investment);

        InvestmentEntry entry = InvestmentEntry.builder()
                .investment(investment)
                .type(InvestmentEntryType.DEPOSIT)
                .amount(request.getInitialAmount())
                .date(java.time.LocalDate.now())
                .note("Aporte inicial")
                .previousValue(BigDecimal.ZERO)
                .build();
        investmentEntryRepository.save(entry);

        return toResponse(investment);
    }

    @Transactional(readOnly = true)
    public List<InvestmentResponse> findAll(User authenticatedUser, InvestmentType typeFilter) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup fg = requireFamilyGroup(user);
        boolean isOwner = user.getRole() == Role.OWNER;

        List<Investment> investments;
        if (typeFilter != null) {
            investments = isOwner
                    ? investmentRepository.findByFamilyGroupAndType(fg, typeFilter)
                    : investmentRepository.findByOwnerAndType(user, typeFilter);
        } else {
            investments = isOwner
                    ? investmentRepository.findByFamilyGroupAndActiveTrue(fg)
                    : investmentRepository.findByOwnerAndActiveTrue(user);
        }

        return investments.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public InvestmentResponse findById(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Investment investment = findOrThrow(id);
        validateAccess(user, investment);
        return toResponse(investment);
    }

    @Transactional
    public InvestmentResponse update(Long id, InvestmentUpdateRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Investment investment = findOrThrow(id);
        validateAccess(user, investment);

        FamilyGroup fg = requireFamilyGroup(user);
        Account linkedAccount = resolveLinkedAccount(request.getLinkedAccountId(), fg);

        investment.setName(request.getName());
        investment.setInstitution(request.getInstitution());
        investment.setIndexer(request.getIndexer());
        investment.setIndexerRate(request.getIndexerRate());
        investment.setFixedRate(request.getFixedRate());
        investment.setCurrentIndexValue(request.getCurrentIndexValue());
        investment.setMaturityDate(request.getMaturityDate());
        investment.setLinkedAccount(linkedAccount);
        investment.recalculate();

        return toResponse(investmentRepository.save(investment));
    }

    @Transactional
    public void deactivate(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Investment investment = findOrThrow(id);
        validateAccess(user, investment);

        if (investment.getCurrentValue().compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessException(
                    "Não é possível desativar um investimento com saldo. Faça o resgate completo antes.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }

        investment.setActive(false);
        investmentRepository.save(investment);
    }

    // ── Entries ───────────────────────────────────────────────────────────────

    @Transactional
    public InvestmentEntryResponse addEntry(Long investmentId,
                                            InvestmentEntryRequest request,
                                            User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Investment investment = findOrThrow(investmentId);
        validateAccess(user, investment);

        if (!investment.isActive()) {
            throw new BusinessException("Investimento inativo.", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        BigDecimal previousValue = investment.getCurrentValue();

        switch (request.getType()) {
            case DEPOSIT -> {
                investment.setTotalInvested(investment.getTotalInvested().add(request.getAmount()));
                investment.setCurrentValue(investment.getCurrentValue().add(request.getAmount()));
            }
            case WITHDRAWAL -> {
                if (request.getAmount().compareTo(investment.getTotalInvested()) > 0) {
                    throw new BusinessException(
                            "Valor de resgate excede o total investido.",
                            HttpStatus.UNPROCESSABLE_ENTITY);
                }
                investment.setTotalInvested(investment.getTotalInvested().subtract(request.getAmount()));
                investment.setCurrentValue(investment.getCurrentValue().subtract(request.getAmount()));
            }
            case YIELD_UPDATE -> {
                // Atualiza apenas currentValue — totalInvested permanece inalterado
                investment.setCurrentValue(request.getAmount());
            }
        }

        investment.setLastUpdatedAt(LocalDateTime.now());
        investment.recalculate();
        investmentRepository.save(investment);

        InvestmentEntry entry = InvestmentEntry.builder()
                .investment(investment)
                .type(request.getType())
                .amount(request.getAmount())
                .date(request.getDate())
                .note(request.getNote())
                .previousValue(previousValue)
                .build();

        return toEntryResponse(investmentEntryRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public Page<InvestmentEntryResponse> findEntries(Long investmentId,
                                                      User authenticatedUser,
                                                      Pageable pageable) {
        User user = reloadUser(authenticatedUser);
        Investment investment = findOrThrow(investmentId);
        validateAccess(user, investment);
        return investmentEntryRepository.findByInvestmentId(investmentId, pageable)
                .map(this::toEntryResponse);
    }

    // ── Summary ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public InvestmentSummaryResponse getInvestmentSummary(User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup fg = requireFamilyGroup(user);
        boolean isOwner = user.getRole() == Role.OWNER;

        List<Investment> investments = isOwner
                ? investmentRepository.findByFamilyGroupAndActiveTrue(fg)
                : investmentRepository.findByOwnerAndActiveTrue(user);

        BigDecimal totalInvested = investments.stream()
                .map(Investment::getTotalInvested)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCurrentValue = investments.stream()
                .map(Investment::getCurrentValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalYield = totalCurrentValue.subtract(totalInvested);
        BigDecimal totalYieldPercentage = totalInvested.compareTo(BigDecimal.ZERO) != 0
                ? totalYield.multiply(BigDecimal.valueOf(100)).divide(totalInvested, 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<InvestmentType, BigDecimal> byType = new EnumMap<>(InvestmentType.class);
        for (Investment inv : investments) {
            byType.merge(inv.getType(), inv.getCurrentValue(), BigDecimal::add);
        }

        return InvestmentSummaryResponse.builder()
                .totalInvested(totalInvested)
                .totalCurrentValue(totalCurrentValue)
                .totalYield(totalYield)
                .totalYieldPercentage(totalYieldPercentage)
                .byType(byType)
                .investments(investments.stream().map(this::toResponse).toList())
                .build();
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    public InvestmentResponse toResponse(Investment inv) {
        inv.recalculate();
        return InvestmentResponse.builder()
                .id(inv.getId())
                .name(inv.getName())
                .type(inv.getType())
                .typeLabel(typeLabel(inv.getType()))
                .institution(inv.getInstitution())
                .totalInvested(inv.getTotalInvested())
                .currentValue(inv.getCurrentValue())
                .yieldAmount(inv.getYieldAmount())
                .yieldPercentage(inv.getYieldPercentage())
                .indexer(inv.getIndexer())
                .indexerRate(inv.getIndexerRate())
                .fixedRate(inv.getFixedRate())
                .currentIndexValue(inv.getCurrentIndexValue())
                .maturityDate(inv.getMaturityDate())
                .estimatedReturn(inv.getEstimatedReturn())
                .linkedAccountId(inv.getLinkedAccount() != null ? inv.getLinkedAccount().getId() : null)
                .linkedAccountName(inv.getLinkedAccount() != null ? inv.getLinkedAccount().getName() : null)
                .active(inv.isActive())
                .ownerId(inv.getOwner().getId())
                .ownerName(inv.getOwner().getName())
                .createdAt(inv.getCreatedAt())
                .lastUpdatedAt(inv.getLastUpdatedAt())
                .build();
    }

    private InvestmentEntryResponse toEntryResponse(InvestmentEntry entry) {
        return InvestmentEntryResponse.builder()
                .id(entry.getId())
                .investmentId(entry.getInvestment().getId())
                .investmentName(entry.getInvestment().getName())
                .type(entry.getType())
                .amount(entry.getAmount())
                .date(entry.getDate())
                .note(entry.getNote())
                .previousValue(entry.getPreviousValue())
                .newValue(entry.getInvestment().getCurrentValue())
                .createdAt(entry.getCreatedAt())
                .build();
    }

    private String typeLabel(InvestmentType type) {
        return switch (type) {
            case FIXED_INCOME -> "Renda Fixa";
            case STOCK -> "Ações";
            case FUND -> "Fundos";
            case CRYPTO -> "Criptomoedas";
        };
    }

    // ── Private helpers ───────────────────────────────────────────────────────

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

    private Investment findOrThrow(Long id) {
        return investmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Investimento não encontrado.", HttpStatus.NOT_FOUND));
    }

    private void validateAccess(User user, Investment investment) {
        FamilyGroup fg = requireFamilyGroup(user);
        if (!investment.getFamilyGroup().getId().equals(fg.getId())) {
            throw new BusinessException("Acesso negado a este investimento.", HttpStatus.FORBIDDEN);
        }
        if (user.getRole() == Role.MEMBER && !investment.getOwner().getId().equals(user.getId())) {
            throw new BusinessException("Acesso negado a este investimento.", HttpStatus.FORBIDDEN);
        }
    }

    private Account resolveLinkedAccount(Long accountId, FamilyGroup fg) {
        if (accountId == null) return null;
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new BusinessException("Conta vinculada não encontrada.", HttpStatus.NOT_FOUND));
        if (!account.getFamilyGroup().getId().equals(fg.getId())) {
            throw new BusinessException("Conta vinculada não pertence ao grupo familiar.", HttpStatus.FORBIDDEN);
        }
        return account;
    }
}
