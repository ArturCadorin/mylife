package com.mylife.finance.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.finance.domain.entity.Account;
import com.mylife.finance.domain.entity.Savings;
import com.mylife.finance.domain.entity.SavingsEntry;
import com.mylife.finance.domain.enums.SavingsEntryType;
import com.mylife.finance.dto.request.SavingsEntryRequest;
import com.mylife.finance.dto.request.SavingsRequest;
import com.mylife.finance.dto.request.SavingsUpdateRequest;
import com.mylife.finance.dto.response.SavingsEntryResponse;
import com.mylife.finance.dto.response.SavingsResponse;
import com.mylife.finance.repository.AccountRepository;
import com.mylife.finance.repository.SavingsEntryRepository;
import com.mylife.finance.repository.SavingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class SavingsService {

    private final SavingsRepository savingsRepository;
    private final SavingsEntryRepository savingsEntryRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional
    public SavingsResponse create(SavingsRequest request, User authenticatedUser) {
        User owner = reloadUser(authenticatedUser);
        FamilyGroup familyGroup = requireFamilyGroup(owner);
        Account linkedAccount = resolveLinkedAccount(request.getLinkedAccountId(), familyGroup);

        Savings savings = Savings.builder()
                .name(request.getName())
                .description(request.getDescription())
                .targetAmount(request.getTargetAmount())
                .currentAmount(BigDecimal.ZERO)
                .cdiRate(request.getCdiRate())
                .currentCdiValue(request.getCurrentCdiValue())
                .linkedAccount(linkedAccount)
                .owner(owner)
                .familyGroup(familyGroup)
                .build();

        savings.calcularEstimatedReturn();
        return toResponse(savingsRepository.save(savings));
    }

    @Transactional(readOnly = true)
    public Page<SavingsResponse> findAll(User authenticatedUser, Pageable pageable) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup familyGroup = requireFamilyGroup(user);

        if (user.getRole() == Role.OWNER) {
            return savingsRepository.findByFamilyGroup(familyGroup, pageable).map(this::toResponse);
        }
        return savingsRepository.findByOwner(user, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public SavingsResponse findById(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Savings savings = findSavingsOrThrow(id);
        validateAccess(user, savings);
        return toResponse(savings);
    }

    @Transactional
    public SavingsResponse update(Long id, SavingsUpdateRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Savings savings = findSavingsOrThrow(id);
        validateAccess(user, savings);

        FamilyGroup familyGroup = requireFamilyGroup(user);
        Account linkedAccount = resolveLinkedAccount(request.getLinkedAccountId(), familyGroup);

        savings.setName(request.getName());
        savings.setDescription(request.getDescription());
        savings.setTargetAmount(request.getTargetAmount());
        savings.setCdiRate(request.getCdiRate());
        savings.setCurrentCdiValue(request.getCurrentCdiValue());
        savings.setLinkedAccount(linkedAccount);
        savings.calcularEstimatedReturn();

        return toResponse(savingsRepository.save(savings));
    }

    @Transactional
    public void delete(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Savings savings = findSavingsOrThrow(id);
        validateAccess(user, savings);

        if (savingsEntryRepository.existsBySavingsId(id)) {
            throw new BusinessException(
                    "Não é possível excluir um cofrinho com movimentações registradas.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }

        savingsRepository.delete(savings);
    }

    @Transactional
    public SavingsEntryResponse addEntry(Long savingsId, SavingsEntryRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Savings savings = findSavingsOrThrow(savingsId);
        validateAccess(user, savings);

        if (request.getType() == SavingsEntryType.WITHDRAWAL
                && savings.getCurrentAmount().compareTo(request.getAmount()) < 0) {
            throw new BusinessException(
                    "Saldo insuficiente para realizar o saque. Saldo atual: R$ " + savings.getCurrentAmount(),
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }

        BigDecimal novoSaldo = request.getType() == SavingsEntryType.DEPOSIT
                ? savings.getCurrentAmount().add(request.getAmount())
                : savings.getCurrentAmount().subtract(request.getAmount());

        savings.setCurrentAmount(novoSaldo);
        savings.calcularEstimatedReturn();
        savingsRepository.save(savings);

        SavingsEntry entry = SavingsEntry.builder()
                .savings(savings)
                .type(request.getType())
                .amount(request.getAmount())
                .date(request.getDate())
                .note(request.getNote())
                .build();

        return toEntryResponse(savingsEntryRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public Page<SavingsEntryResponse> findEntries(Long savingsId, User authenticatedUser, Pageable pageable) {
        User user = reloadUser(authenticatedUser);
        Savings savings = findSavingsOrThrow(savingsId);
        validateAccess(user, savings);

        return savingsEntryRepository.findBySavingsId(savingsId, pageable).map(this::toEntryResponse);
    }

    // --- Helpers ---

    private User reloadUser(User authenticatedUser) {
        return userRepository.findById(authenticatedUser.getId())
                .orElseThrow(() -> new BusinessException("Usuário não encontrado.", HttpStatus.NOT_FOUND));
    }

    private FamilyGroup requireFamilyGroup(User user) {
        FamilyGroup fg = user.getFamilyGroup();
        if (fg == null) {
            throw new BusinessException(
                    "Usuário não pertence a um grupo familiar. Crie ou entre em um grupo para gerenciar cofrinhos.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }
        return fg;
    }

    private Savings findSavingsOrThrow(Long id) {
        return savingsRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Cofrinho não encontrado.", HttpStatus.NOT_FOUND));
    }

    private void validateAccess(User user, Savings savings) {
        FamilyGroup familyGroup = requireFamilyGroup(user);
        if (!savings.getFamilyGroup().getId().equals(familyGroup.getId())) {
            throw new BusinessException("Acesso negado a este cofrinho.", HttpStatus.FORBIDDEN);
        }
        if (user.getRole() == Role.MEMBER && !savings.getOwner().getId().equals(user.getId())) {
            throw new BusinessException("Acesso negado a este cofrinho.", HttpStatus.FORBIDDEN);
        }
    }

    private Account resolveLinkedAccount(Long linkedAccountId, FamilyGroup familyGroup) {
        if (linkedAccountId == null) return null;
        Account account = accountRepository.findById(linkedAccountId)
                .orElseThrow(() -> new BusinessException("Conta vinculada não encontrada.", HttpStatus.NOT_FOUND));
        if (!account.getFamilyGroup().getId().equals(familyGroup.getId())) {
            throw new BusinessException("Conta vinculada não pertence ao grupo familiar.", HttpStatus.FORBIDDEN);
        }
        return account;
    }

    private BigDecimal calcPercentualDaMeta(Savings savings) {
        if (savings.getTargetAmount() == null || savings.getTargetAmount().compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return savings.getCurrentAmount()
                .divide(savings.getTargetAmount(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private SavingsResponse toResponse(Savings savings) {
        return SavingsResponse.builder()
                .id(savings.getId())
                .name(savings.getName())
                .description(savings.getDescription())
                .targetAmount(savings.getTargetAmount())
                .currentAmount(savings.getCurrentAmount())
                .cdiRate(savings.getCdiRate())
                .currentCdiValue(savings.getCurrentCdiValue())
                .estimatedReturn(savings.getEstimatedReturn())
                .linkedAccountId(savings.getLinkedAccount() != null ? savings.getLinkedAccount().getId() : null)
                .linkedAccountName(savings.getLinkedAccount() != null ? savings.getLinkedAccount().getName() : null)
                .ownerId(savings.getOwner().getId())
                .ownerName(savings.getOwner().getName())
                .percentualDaMeta(calcPercentualDaMeta(savings))
                .createdAt(savings.getCreatedAt())
                .build();
    }

    private SavingsEntryResponse toEntryResponse(SavingsEntry entry) {
        return SavingsEntryResponse.builder()
                .id(entry.getId())
                .savingsId(entry.getSavings().getId())
                .savingsName(entry.getSavings().getName())
                .type(entry.getType())
                .amount(entry.getAmount())
                .date(entry.getDate())
                .note(entry.getNote())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
