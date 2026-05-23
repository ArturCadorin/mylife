package com.mylife.finance.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SavingsServiceTest {

    @Mock private SavingsRepository savingsRepository;
    @Mock private SavingsEntryRepository savingsEntryRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private SavingsService savingsService;

    private FamilyGroup familyGroup;
    private User owner;
    private User member;
    private Savings savings;

    @BeforeEach
    void setUp() {
        familyGroup = FamilyGroup.builder()
                .id(1L)
                .name("Família Teste")
                .build();

        owner = User.builder()
                .id(1L).name("Proprietário").email("owner@test.com")
                .role(Role.OWNER).familyGroup(familyGroup).build();

        member = User.builder()
                .id(2L).name("Membro").email("member@test.com")
                .role(Role.MEMBER).familyGroup(familyGroup).build();

        savings = Savings.builder()
                .id(1L)
                .name("Reserva de Emergência")
                .currentAmount(new BigDecimal("500.00"))
                .cdiRate(new BigDecimal("100.00"))
                .currentCdiValue(new BigDecimal("10.75"))
                .owner(owner)
                .familyGroup(familyGroup)
                .createdAt(LocalDateTime.now())
                .build();
        savings.calcularEstimatedReturn();
    }

    // --- create ---

    @Test
    void create_shouldSaveAndReturnSavings() {
        SavingsRequest request = new SavingsRequest();
        request.setName("Reserva de Emergência");
        request.setCdiRate(new BigDecimal("100.00"));
        request.setCurrentCdiValue(new BigDecimal("10.75"));

        Savings novoSavings = Savings.builder()
                .id(2L).name("Reserva de Emergência")
                .currentAmount(BigDecimal.ZERO)
                .cdiRate(new BigDecimal("100.00"))
                .currentCdiValue(new BigDecimal("10.75"))
                .owner(owner).familyGroup(familyGroup)
                .createdAt(LocalDateTime.now()).build();
        novoSavings.calcularEstimatedReturn();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(savingsRepository.save(any(Savings.class))).thenReturn(novoSavings);

        SavingsResponse response = savingsService.create(request, owner);

        assertThat(response.getName()).isEqualTo("Reserva de Emergência");
        assertThat(response.getCurrentAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getEstimatedReturn()).isEqualByComparingTo(BigDecimal.ZERO);
        verify(savingsRepository).save(any(Savings.class));
    }

    @Test
    void create_shouldThrow_whenUserHasNoFamilyGroup() {
        User loner = User.builder().id(3L).name("Solo").email("solo@test.com")
                .role(Role.MEMBER).familyGroup(null).build();
        when(userRepository.findById(3L)).thenReturn(Optional.of(loner));

        SavingsRequest request = new SavingsRequest();
        request.setName("Cofrinho");
        request.setCdiRate(new BigDecimal("100.00"));
        request.setCurrentCdiValue(new BigDecimal("10.75"));

        assertThatThrownBy(() -> savingsService.create(request, loner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("grupo familiar")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    // --- findAll ---

    @Test
    void findAll_asOwner_shouldReturnAllFamilyGroupSavings() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(savingsRepository.findByFamilyGroup(familyGroup, pageable))
                .thenReturn(new PageImpl<>(List.of(savings)));

        Page<SavingsResponse> result = savingsService.findAll(owner, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(savingsRepository).findByFamilyGroup(familyGroup, pageable);
        verify(savingsRepository, never()).findByOwner(any(), any());
    }

    @Test
    void findAll_asMember_shouldReturnOnlyOwnSavings() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(savingsRepository.findByOwner(member, pageable))
                .thenReturn(new PageImpl<>(List.of(savings)));

        Page<SavingsResponse> result = savingsService.findAll(member, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(savingsRepository).findByOwner(member, pageable);
        verify(savingsRepository, never()).findByFamilyGroup(any(), any());
    }

    // --- findById ---

    @Test
    void findById_shouldReturn_whenOwnerAccesses() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(savingsRepository.findById(1L)).thenReturn(Optional.of(savings));

        SavingsResponse response = savingsService.findById(1L, owner);

        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    void findById_shouldThrow_whenSavingsBelongsToDifferentFamilyGroup() {
        FamilyGroup otherGroup = FamilyGroup.builder().id(99L).name("Outro").build();
        Savings otherSavings = Savings.builder()
                .id(99L).name("X").currentAmount(BigDecimal.ZERO)
                .cdiRate(new BigDecimal("100")).currentCdiValue(new BigDecimal("10"))
                .owner(owner).familyGroup(otherGroup).createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(savingsRepository.findById(99L)).thenReturn(Optional.of(otherSavings));

        assertThatThrownBy(() -> savingsService.findById(99L, owner))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void findById_shouldThrow_whenMemberAccessesOtherMemberSavings() {
        Savings ownerSavings = Savings.builder()
                .id(1L).name("Cofrinho do Owner").currentAmount(BigDecimal.ZERO)
                .cdiRate(new BigDecimal("100")).currentCdiValue(new BigDecimal("10"))
                .owner(owner).familyGroup(familyGroup).createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(savingsRepository.findById(1L)).thenReturn(Optional.of(ownerSavings));

        assertThatThrownBy(() -> savingsService.findById(1L, member))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    // --- estimatedReturn ---

    @Test
    void calcularEstimatedReturn_shouldComputeCorrectly() {
        // 500 * (100/100) * (10.75/100) = 53.75
        assertThat(savings.getEstimatedReturn()).isEqualByComparingTo("53.75");
    }

    @Test
    void calcularEstimatedReturn_shouldRespectCdiRatePercentage() {
        Savings partial = Savings.builder()
                .id(2L).name("Parcial").currentAmount(new BigDecimal("1000.00"))
                .cdiRate(new BigDecimal("90.00")).currentCdiValue(new BigDecimal("10.00"))
                .owner(owner).familyGroup(familyGroup).createdAt(LocalDateTime.now()).build();
        partial.calcularEstimatedReturn();

        // 1000 * (90/100) * (10/100) = 90.00
        assertThat(partial.getEstimatedReturn()).isEqualByComparingTo("90.00");
    }

    // --- update ---

    @Test
    void update_shouldUpdateFieldsAndRecalculate() {
        SavingsUpdateRequest request = new SavingsUpdateRequest();
        request.setName("Fundo de Reserva");
        request.setCdiRate(new BigDecimal("110.00"));
        request.setCurrentCdiValue(new BigDecimal("12.00"));

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(savingsRepository.findById(1L)).thenReturn(Optional.of(savings));
        when(savingsRepository.save(savings)).thenReturn(savings);

        savingsService.update(1L, request, owner);

        assertThat(savings.getName()).isEqualTo("Fundo de Reserva");
        assertThat(savings.getCdiRate()).isEqualByComparingTo("110.00");
        // estimatedReturn recalculado: 500 * (110/100) * (12/100) = 66.00
        assertThat(savings.getEstimatedReturn()).isEqualByComparingTo("66.00");
        verify(savingsRepository).save(savings);
    }

    // --- delete ---

    @Test
    void delete_shouldSucceed_whenNoEntriesExist() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(savingsRepository.findById(1L)).thenReturn(Optional.of(savings));
        when(savingsEntryRepository.existsBySavingsId(1L)).thenReturn(false);

        savingsService.delete(1L, owner);

        verify(savingsRepository).delete(savings);
    }

    @Test
    void delete_shouldThrow_whenEntriesExist() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(savingsRepository.findById(1L)).thenReturn(Optional.of(savings));
        when(savingsEntryRepository.existsBySavingsId(1L)).thenReturn(true);

        assertThatThrownBy(() -> savingsService.delete(1L, owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("movimentações")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        verify(savingsRepository, never()).delete(any());
    }

    // --- addEntry ---

    @Test
    void addEntry_DEPOSIT_shouldIncreaseCurrentAmountAndRecalculate() {
        SavingsEntryRequest request = new SavingsEntryRequest();
        request.setType(SavingsEntryType.DEPOSIT);
        request.setAmount(new BigDecimal("200.00"));
        request.setDate(LocalDate.now());

        SavingsEntry savedEntry = SavingsEntry.builder()
                .id(1L).savings(savings).type(SavingsEntryType.DEPOSIT)
                .amount(new BigDecimal("200.00")).date(LocalDate.now())
                .createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(savingsRepository.findById(1L)).thenReturn(Optional.of(savings));
        when(savingsRepository.save(savings)).thenReturn(savings);
        when(savingsEntryRepository.save(any(SavingsEntry.class))).thenReturn(savedEntry);

        SavingsEntryResponse response = savingsService.addEntry(1L, request, owner);

        // 500 + 200 = 700
        assertThat(savings.getCurrentAmount()).isEqualByComparingTo("700.00");
        // estimatedReturn: 700 * (100/100) * (10.75/100) = 75.25
        assertThat(savings.getEstimatedReturn()).isEqualByComparingTo("75.25");
        assertThat(response.getType()).isEqualTo(SavingsEntryType.DEPOSIT);
        assertThat(response.getAmount()).isEqualByComparingTo("200.00");
        verify(savingsRepository).save(savings);
        verify(savingsEntryRepository).save(any(SavingsEntry.class));
    }

    @Test
    void addEntry_WITHDRAWAL_shouldDecreaseCurrentAmount() {
        SavingsEntryRequest request = new SavingsEntryRequest();
        request.setType(SavingsEntryType.WITHDRAWAL);
        request.setAmount(new BigDecimal("100.00"));
        request.setDate(LocalDate.now());

        SavingsEntry savedEntry = SavingsEntry.builder()
                .id(1L).savings(savings).type(SavingsEntryType.WITHDRAWAL)
                .amount(new BigDecimal("100.00")).date(LocalDate.now())
                .createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(savingsRepository.findById(1L)).thenReturn(Optional.of(savings));
        when(savingsRepository.save(savings)).thenReturn(savings);
        when(savingsEntryRepository.save(any(SavingsEntry.class))).thenReturn(savedEntry);

        savingsService.addEntry(1L, request, owner);

        // 500 - 100 = 400
        assertThat(savings.getCurrentAmount()).isEqualByComparingTo("400.00");
    }

    @Test
    void addEntry_WITHDRAWAL_shouldThrow_whenInsufficientBalance() {
        SavingsEntryRequest request = new SavingsEntryRequest();
        request.setType(SavingsEntryType.WITHDRAWAL);
        request.setAmount(new BigDecimal("1000.00")); // > saldo atual (500)
        request.setDate(LocalDate.now());

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(savingsRepository.findById(1L)).thenReturn(Optional.of(savings));

        assertThatThrownBy(() -> savingsService.addEntry(1L, request, owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Saldo insuficiente")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        verify(savingsRepository, never()).save(any());
        verify(savingsEntryRepository, never()).save(any());
    }

    // --- findEntries ---

    @Test
    void findEntries_shouldReturnPaginatedEntries() {
        SavingsEntry entry = SavingsEntry.builder()
                .id(1L).savings(savings).type(SavingsEntryType.DEPOSIT)
                .amount(new BigDecimal("100.00")).date(LocalDate.now())
                .createdAt(LocalDateTime.now()).build();

        PageRequest pageable = PageRequest.of(0, 20);
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(savingsRepository.findById(1L)).thenReturn(Optional.of(savings));
        when(savingsEntryRepository.findBySavingsId(1L, pageable))
                .thenReturn(new PageImpl<>(List.of(entry)));

        Page<SavingsEntryResponse> result = savingsService.findEntries(1L, owner, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getSavingsName()).isEqualTo("Reserva de Emergência");
    }

    // --- percentualDaMeta ---

    @Test
    void toResponse_shouldCalculatePercentualDaMeta_whenTargetAmountSet() {
        savings.setTargetAmount(new BigDecimal("1000.00")); // meta: 1000, atual: 500
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(savingsRepository.findById(1L)).thenReturn(Optional.of(savings));

        SavingsResponse response = savingsService.findById(1L, owner);

        // 500 / 1000 * 100 = 50.00%
        assertThat(response.getPercentualDaMeta()).isEqualByComparingTo("50.00");
    }

    @Test
    void toResponse_shouldReturnNullPercentual_whenNoTargetAmount() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(savingsRepository.findById(1L)).thenReturn(Optional.of(savings));

        SavingsResponse response = savingsService.findById(1L, owner);

        assertThat(response.getPercentualDaMeta()).isNull();
    }
}
