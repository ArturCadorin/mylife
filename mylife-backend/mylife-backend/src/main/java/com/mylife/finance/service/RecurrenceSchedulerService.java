package com.mylife.finance.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecurrenceSchedulerService {

    private final TransactionService transactionService;

    @Scheduled(cron = "0 0 0 * * *")
    public void processRecurringTransactions() {
        LocalDate today = LocalDate.now();
        log.info("Processando transações recorrentes para {}", today);

        List<Long> ids = transactionService.findDueRecurringTransactionIds(today);
        log.info("{} transação(ões) recorrente(s) encontrada(s).", ids.size());

        for (Long id : ids) {
            try {
                transactionService.processRecurringParent(id);
            } catch (Exception e) {
                log.error("Erro ao processar transação recorrente id={}: {}", id, e.getMessage());
            }
        }
    }
}
