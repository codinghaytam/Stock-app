package com.olivepro.service;

import com.olivepro.domain.*;
import com.olivepro.dto.request.*;
import com.olivepro.enums.*;
import com.olivepro.exception.BusinessRuleException;
import com.olivepro.exception.ResourceNotFoundException;
import com.olivepro.repository.*;
import com.olivepro.websocket.AlertsBroadcaster;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class AccountingService {

    private static final Logger log = LoggerFactory.getLogger(AccountingService.class);

    private final ExpenseRepository expenseRepo;
    private final BankCheckRepository checkRepo;
    private final BankAccountRepository bankAccountRepo;
    private final TransactionRepository txRepo;
    private final ActivityLogService logService;
    private final AlertsBroadcaster broadcaster;

    public AccountingService(ExpenseRepository expenseRepo, BankCheckRepository checkRepo,
                              BankAccountRepository bankAccountRepo, TransactionRepository txRepo,
                              ActivityLogService logService, AlertsBroadcaster broadcaster) {
        this.expenseRepo = expenseRepo; this.checkRepo = checkRepo;
        this.bankAccountRepo = bankAccountRepo; this.txRepo = txRepo;
        this.logService = logService; this.broadcaster = broadcaster;
    }

    // ─── EXPENSES ────────────────────────────────────────────────────────────

    public List<Expense> getExpenses() { return expenseRepo.findAll(); }

    @Transactional
    public Expense createExpense(ExpenseRequest req, String username) {
        Expense e = Expense.builder()
                .description(req.getDescription()).amount(req.getAmount())
                .category(req.getCategory()).paymentMethod(req.getPaymentMethod())
                .bankAccountId(req.getBankAccountId())
                .date(req.getDate() != null ? req.getDate() : LocalDate.now())
                .createdBy(username).build();
        Expense saved = expenseRepo.save(e);
        logService.log(username, "Dépense", req.getCategory() + ": " + req.getDescription(), req.getAmount());
        return saved;
    }

    @Transactional
    public void deleteExpense(Long id, String username) {
        expenseRepo.deleteById(id);
        logService.log(username, "Dépense", "Suppression id=" + id, null);
    }

    // ─── CAISSE (derived) ────────────────────────────────────────────────────

    public double getCaisseUsine() {
        double venteEspece = txRepo.sumAmountPaidByPaymentMethod(PaymentMethod.ESPECE);
        double versements = txRepo.sumVersements();
        double achatEspece = txRepo.sumPurchaseAmountPaidByPaymentMethod(PaymentMethod.ESPECE);
        double expensesEspece = expenseRepo.sumPositiveByPaymentMethod(PaymentMethod.ESPECE);
        double incomeEspece = -expenseRepo.sumNegativeByPaymentMethod(PaymentMethod.ESPECE);
        return venteEspece + versements - achatEspece - expensesEspece + incomeEspece;
    }

    public double getCaisseDirecteur() {
        double income = txRepo.sumAmountPaidByPaymentMethod(PaymentMethod.CAISSE_DIRECTEUR);
        double expenses = expenseRepo.sumPositiveByPaymentMethod(PaymentMethod.CAISSE_DIRECTEUR);
        return income - expenses;
    }

    public double getNetProfit() {
        return txRepo.sumTotalSales() - txRepo.sumTotalPurchases() - expenseRepo.sumAllPositive();
    }

    // ─── BANK CHECKS ─────────────────────────────────────────────────────────

    public List<BankCheck> getChecks() { return checkRepo.findAll(); }

    public List<BankCheck> getUrgentChecks() {
        return checkRepo.findByStatusAndDueDateBefore(CheckStatus.EN_COFFRE, LocalDate.now().plusDays(4));
    }

    @Transactional
    public BankCheck createCheck(BankCheckRequest req, String username) {
        BankCheck c = BankCheck.builder()
                .checkNumber(req.getCheckNumber()).amount(req.getAmount())
                .direction(req.getDirection()).partnerName(req.getPartnerName())
                .bankName(req.getBankName()).dueDate(req.getDueDate())
                .notes(req.getNotes()).createdBy(username).build();
        BankCheck saved = checkRepo.save(c);
        logService.log(username, "Chèque", req.getDirection() + " N°" + req.getCheckNumber() + " " + req.getAmount() + " DH", req.getAmount());
        broadcaster.broadcast();
        return saved;
    }

    @Transactional
    public BankCheck updateCheckStatus(Long id, CheckStatus newStatus, String username) {
        BankCheck c = checkRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Check not found: " + id));
        c.setStatus(newStatus);
        BankCheck saved = checkRepo.save(c);
        logService.log(username, "Chèque", "Statut mis à jour: " + newStatus + " pour N°" + c.getCheckNumber(), null);
        broadcaster.broadcast();
        return saved;
    }

    @Transactional
    public void deleteCheck(Long id, String username) {
        checkRepo.deleteById(id);
        logService.log(username, "Chèque", "Suppression id=" + id, null);
    }

    // ─── BANK ACCOUNTS ───────────────────────────────────────────────────────

    public List<BankAccount> getBankAccounts() { return bankAccountRepo.findAll(); }

    @Transactional
    public BankAccount createBankAccount(BankAccountRequest req, String username) {
        BankAccount acc = BankAccount.builder()
                .name(req.getName()).bankName(req.getBankName())
                .accountNumber(req.getAccountNumber())
                .currency(req.getCurrency() != null ? req.getCurrency() : Currency.MAD)
                .balance(req.getBalance()).build();
        logService.log(username, "Banque", "Nouveau compte: " + req.getName(), null);
        return bankAccountRepo.save(acc);
    }

    @Transactional
    public BankAccount updateBankAccount(Long id, BankAccountRequest req, String username) {
        BankAccount acc = bankAccountRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount not found: " + id));
        acc.setName(req.getName()); acc.setBankName(req.getBankName());
        acc.setBalance(req.getBalance());
        logService.log(username, "Banque", "Mise à jour: " + req.getName(), null);
        return bankAccountRepo.save(acc);
    }

    public void updateBalance(Long bankAccountId, double delta) {
        bankAccountRepo.findById(bankAccountId).ifPresent(acc -> {
            acc.setBalance(acc.getBalance() + delta);
            bankAccountRepo.save(acc);
            log.info("BankAccount {} balance delta={}", acc.getName(), delta);
        });
    }
}

