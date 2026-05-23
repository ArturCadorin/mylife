package com.mylife.finance.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.finance.domain.entity.Account;
import com.mylife.finance.domain.entity.Investment;
import com.mylife.finance.domain.entity.InvestmentEntry;
import com.mylife.finance.domain.enums.*;
import com.mylife.finance.dto.request.InvestmentEntryRequest;
import com.mylife.finance.dto.request.InvestmentRequest;
import com.mylife.finance.dto.request.InvestmentUpdateRequest;
import com.mylife.finance.dto.response.InvestmentEntryResponse;
import com.mylife.finance.dto.response.InvestmentResponse;
import com.mylife.finance.dto.response.report.InvestmentSummaryResponse;
import com.mylife.finance.repository.AccountRepository;
import com.mylife.finance.repository.InvestmentEntryRepository;
import com.mylife.finance.repository.InvestmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvestmentServiceTest {

    @Mock private InvestmentRepository investmentRepository;
    @Mock private InvestmentEntryRepository investmentEntryRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private InvestmentService investmentService;

    private FamilyGroup familyGroup;
    private User owner;
    private User member;

    private Investment fixedIncomeInvestment() {
        Investment inv = Investment.builder()
                .id(1L).name("CDB Nubank 110% CDI")
                .type(InvestmentType.FIXED_INCOME)
                .institution("Nubank")
                .totalInvested(new BigDecimal("5000.00"))
                .currentValue(new BigDecimal("5200.00"))
                .indexer(FixedIncomeIndexer.CDI)
                .indexerRate(new BigDecimal("110.0000"))
                .currentIndexValue(new BigDecimal("10.5000"))
                .active(true)
                .owner(owner).familyGroup(familyGroup)
                .createdAt(LocalDateTime.now())
                .lastUpdatedAt(LocalDateTime.now())
                .build();
        inv.recalculate();
        return inv;
    }

    private Investment stockInvestment() {
        Investment inv = Investment.builder()
                .id(2L).name("PETR4")
                .type(InvestmentType.STOCK)
                .institution("XP Investimentos")
                .totalInvested(new BigDecimal("3000.00"))
                .currentValue(new BigDecimal("3500.00"))
                .active(true)
                .owner(owner).familyGroup(familyGroup)
                .createdAt(LocalDateTime.now())
                .lastUpdatedAt(LocalDateTime.now())
                .build();
        inv.recalculate();
        return inv;
    }

    @BeforeEach
    void setUp() {
        familyGroup = FamilyGroup.builder().id(1L).name("Família").build();
        owner = User.builder()
                .id(1L).name("Owner").email("owner@test.com")
                .role(Role.OWNER).familyGroup(familyGroup).build();
        member = User.builder()
                .id(2L).name("Member").email("member@test.com")
                .role(Role.MEMBER).familyGroup(familyGroup).build();
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_shouldPersistInvestmentAndInitialEntry() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));

        InvestmentRequest request = new InvestmentRequest();
        request.setName("CDB Nubank");
        request.setType(InvestmentType.FIXED_INCOME);
        request.setInstitution("Nubank");
        request.setInitialAmount(new BigDecimal("5000.00"));
        request.setIndexer(FixedIncomeIndexer.CDI);
        request.setIndexerRate(new BigDecimal("110.0000"));
        request.setCurrentIndexValue(new BigDecimal("10.5000"));

        Investment saved = fixedIncomeInvestment();
        when(investmentRepository.save(any())).thenReturn(saved);

        InvestmentEntry entrySaved = InvestmentEntry.builder()
                .id(1L).investment(saved).type(InvestmentEntryType.DEPOSIT)
                .amount(new BigDecimal("5000.00")).date(LocalDate.now())
                .previousValue(BigDecimal.ZERO).createdAt(LocalDateTime.now())
                .build();
        when(investmentEntryRepository.save(any())).thenReturn(entrySaved);

        InvestmentResponse result = investmentService.create(request, owner);

        assertThat(result.getName()).isEqualTo("CDB Nubank 110% CDI");
        assertThat(result.getTotalInvested()).isEqualByComparingTo("5000.00");
        assertThat(result.getTypeLabel()).isEqualTo("Renda Fixa");

        ArgumentCaptor<Investment> invCaptor = ArgumentCaptor.forClass(Investment.class);
        verify(investmentRepository).save(invCaptor.capture());
        assertThat(invCaptor.getValue().getTotalInvested()).isEqualByComparingTo("5000.00");
        assertThat(invCaptor.getValue().getCurrentValue()).isEqualByComparingTo("5000.00");

        ArgumentCaptor<InvestmentEntry> entryCaptor = ArgumentCaptor.forClass(InvestmentEntry.class);
        verify(investmentEntryRepository).save(entryCaptor.capture());
        assertThat(entryCaptor.getValue().getType()).isEqualTo(InvestmentEntryType.DEPOSIT);
        assertThat(entryCaptor.getValue().getPreviousValue()).isEqualByComparingTo("0");
    }

    // ── addEntry: DEPOSIT ─────────────────────────────────────────────────────

    @Test
    void addEntry_deposit_shouldIncreaseBothTotalInvestedAndCurrentValue() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        Investment investment = fixedIncomeInvestment();
        when(investmentRepository.findById(1L)).thenReturn(Optional.of(investment));
        when(investmentRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        InvestmentEntry savedEntry = InvestmentEntry.builder()
                .id(10L).investment(investment).type(InvestmentEntryType.DEPOSIT)
                .amount(new BigDecimal("1000.00")).date(LocalDate.now())
                .previousValue(new BigDecimal("5200.00")).createdAt(LocalDateTime.now())
                .build();
        when(investmentEntryRepository.save(any())).thenReturn(savedEntry);

        InvestmentEntryRequest req = new InvestmentEntryRequest();
        req.setType(InvestmentEntryType.DEPOSIT);
        req.setAmount(new BigDecimal("1000.00"));
        req.setDate(LocalDate.now());

        investmentService.addEntry(1L, req, owner);

        assertThat(investment.getTotalInvested()).isEqualByComparingTo("6000.00");
        assertThat(investment.getCurrentValue()).isEqualByComparingTo("6200.00");
    }

    // ── addEntry: WITHDRAWAL ──────────────────────────────────────────────────

    @Test
    void addEntry_withdrawal_shouldDecreaseBothValues() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        Investment investment = fixedIncomeInvestment();
        when(investmentRepository.findById(1L)).thenReturn(Optional.of(investment));
        when(investmentRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        InvestmentEntry savedEntry = InvestmentEntry.builder()
                .id(11L).investment(investment).type(InvestmentEntryType.WITHDRAWAL)
                .amount(new BigDecimal("2000.00")).date(LocalDate.now())
                .previousValue(new BigDecimal("5200.00")).createdAt(LocalDateTime.now())
                .build();
        when(investmentEntryRepository.save(any())).thenReturn(savedEntry);

        InvestmentEntryRequest req = new InvestmentEntryRequest();
        req.setType(InvestmentEntryType.WITHDRAWAL);
        req.setAmount(new BigDecimal("2000.00"));
        req.setDate(LocalDate.now());

        investmentService.addEntry(1L, req, owner);

        assertThat(investment.getTotalInvested()).isEqualByComparingTo("3000.00");
        assertThat(investment.getCurrentValue()).isEqualByComparingTo("3200.00");
    }

    @Test
    void addEntry_withdrawal_exceedsTotalInvested_shouldThrow() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        Investment investment = fixedIncomeInvestment();
        when(investmentRepository.findById(1L)).thenReturn(Optional.of(investment));

        InvestmentEntryRequest req = new InvestmentEntryRequest();
        req.setType(InvestmentEntryType.WITHDRAWAL);
        req.setAmount(new BigDecimal("9999.00"));
        req.setDate(LocalDate.now());

        assertThatThrownBy(() -> investmentService.addEntry(1L, req, owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("excede o total investido");
    }

    // ── addEntry: YIELD_UPDATE ────────────────────────────────────────────────

    @Test
    void addEntry_yieldUpdate_shouldOnlyUpdateCurrentValue() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        Investment investment = stockInvestment();
        when(investmentRepository.findById(2L)).thenReturn(Optional.of(investment));
        when(investmentRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        InvestmentEntry savedEntry = InvestmentEntry.builder()
                .id(12L).investment(investment).type(InvestmentEntryType.YIELD_UPDATE)
                .amount(new BigDecimal("4000.00")).date(LocalDate.now())
                .previousValue(new BigDecimal("3500.00")).createdAt(LocalDateTime.now())
                .build();
        when(investmentEntryRepository.save(any())).thenReturn(savedEntry);

        InvestmentEntryRequest req = new InvestmentEntryRequest();
        req.setType(InvestmentEntryType.YIELD_UPDATE);
        req.setAmount(new BigDecimal("4000.00"));
        req.setDate(LocalDate.now());

        investmentService.addEntry(2L, req, owner);

        // totalInvested unchanged
        assertThat(investment.getTotalInvested()).isEqualByComparingTo("3000.00");
        // currentValue updated to the new amount
        assertThat(investment.getCurrentValue()).isEqualByComparingTo("4000.00");
    }

    // ── deactivate ────────────────────────────────────────────────────────────

    @Test
    void deactivate_withPositiveBalance_shouldThrow() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(investmentRepository.findById(1L)).thenReturn(Optional.of(fixedIncomeInvestment()));

        assertThatThrownBy(() -> investmentService.deactivate(1L, owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("saldo");
    }

    @Test
    void deactivate_zeroBalance_shouldSucceed() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        Investment investment = Investment.builder()
                .id(5L).name("Zerado").type(InvestmentType.STOCK).institution("XP")
                .totalInvested(BigDecimal.ZERO).currentValue(BigDecimal.ZERO)
                .active(true).owner(owner).familyGroup(familyGroup)
                .createdAt(LocalDateTime.now()).lastUpdatedAt(LocalDateTime.now())
                .build();
        investment.recalculate();
        when(investmentRepository.findById(5L)).thenReturn(Optional.of(investment));
        when(investmentRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        investmentService.deactivate(5L, owner);

        assertThat(investment.isActive()).isFalse();
    }

    // ── getInvestmentSummary ──────────────────────────────────────────────────

    @Test
    void getInvestmentSummary_shouldAggregateCorrectly() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        Investment fi = fixedIncomeInvestment();   // totalInvested=5000, currentValue=5200
        Investment st = stockInvestment();         // totalInvested=3000, currentValue=3500
        when(investmentRepository.findByFamilyGroupAndActiveTrue(familyGroup))
                .thenReturn(List.of(fi, st));

        InvestmentSummaryResponse result = investmentService.getInvestmentSummary(owner);

        assertThat(result.getTotalInvested()).isEqualByComparingTo("8000.00");
        assertThat(result.getTotalCurrentValue()).isEqualByComparingTo("8700.00");
        assertThat(result.getTotalYield()).isEqualByComparingTo("700.00");
        // yieldPct = 700/8000 * 100 = 8.75%
        assertThat(result.getTotalYieldPercentage()).isEqualByComparingTo("8.7500");
        assertThat(result.getByType()).containsKey(InvestmentType.FIXED_INCOME);
        assertThat(result.getByType().get(InvestmentType.FIXED_INCOME)).isEqualByComparingTo("5200.00");
        assertThat(result.getByType().get(InvestmentType.STOCK)).isEqualByComparingTo("3500.00");
        assertThat(result.getInvestments()).hasSize(2);
    }

    // ── yieldAmount and yieldPercentage calculation ───────────────────────────

    @Test
    void investment_yieldCalculation_shouldBeCorrect() {
        Investment inv = fixedIncomeInvestment();
        // totalInvested=5000, currentValue=5200 → yield=200, pct=4%
        assertThat(inv.getYieldAmount()).isEqualByComparingTo("200.00");
        assertThat(inv.getYieldPercentage()).isEqualByComparingTo("4.0000");
    }

    // ── member access control ─────────────────────────────────────────────────

    @Test
    void findById_memberAccessingOtherMemberInvestment_shouldThrow() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(member));

        User otherMember = User.builder().id(3L).name("Other")
                .role(Role.MEMBER).familyGroup(familyGroup).build();
        Investment inv = Investment.builder()
                .id(10L).name("Alheio").type(InvestmentType.CRYPTO).institution("Binance")
                .totalInvested(BigDecimal.TEN).currentValue(BigDecimal.TEN)
                .active(true).owner(otherMember).familyGroup(familyGroup)
                .createdAt(LocalDateTime.now()).lastUpdatedAt(LocalDateTime.now())
                .build();
        inv.recalculate();
        when(investmentRepository.findById(10L)).thenReturn(Optional.of(inv));

        assertThatThrownBy(() -> investmentService.findById(10L, member))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Acesso negado");
    }
}
