package com.olivepro.repository;

import com.olivepro.domain.Expense;
import com.olivepro.enums.ExpenseCategory;
import com.olivepro.enums.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByPaymentMethod(PaymentMethod method);
    List<Expense> findByCategory(ExpenseCategory category);
    List<Expense> findByDateBetween(LocalDate from, LocalDate to);

    @Query("SELECT COALESCE(SUM(e.amount),0) FROM Expense e WHERE e.amount > 0 AND e.paymentMethod = ?1")
    double sumPositiveByPaymentMethod(PaymentMethod method);

    @Query("SELECT COALESCE(SUM(e.amount),0) FROM Expense e WHERE e.amount < 0 AND e.paymentMethod = ?1")
    double sumNegativeByPaymentMethod(PaymentMethod method);

    @Query("SELECT COALESCE(SUM(e.amount),0) FROM Expense e WHERE e.amount > 0")
    double sumAllPositive();
}

