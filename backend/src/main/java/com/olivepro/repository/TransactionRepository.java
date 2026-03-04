package com.olivepro.repository;

import com.olivepro.domain.Transaction;
import com.olivepro.enums.PaymentMethod;
import com.olivepro.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByType(TransactionType type);
    List<Transaction> findByVehicleId(Long vehicleId);
    List<Transaction> findByPartnerNameContainingIgnoreCase(String partnerName);
    List<Transaction> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
    List<Transaction> findByTypeAndPaymentMethod(TransactionType type, PaymentMethod method);
    List<Transaction> findByTypeIn(List<TransactionType> types);

    @Query("SELECT COALESCE(SUM(t.priceTotal),0) FROM Transaction t WHERE t.type = 'VENTE'")
    double sumTotalSales();

    @Query("SELECT COALESCE(SUM(t.priceTotal),0) FROM Transaction t WHERE t.type = 'ACHAT'")
    double sumTotalPurchases();

    @Query("SELECT COALESCE(SUM(t.amountPaid),0) FROM Transaction t WHERE t.type = 'VENTE' AND t.paymentMethod = ?1")
    double sumAmountPaidByPaymentMethod(PaymentMethod method);

    @Query("SELECT COALESCE(SUM(t.amountPaid),0) FROM Transaction t WHERE t.type = 'ACHAT' AND t.paymentMethod = ?1")
    double sumPurchaseAmountPaidByPaymentMethod(PaymentMethod method);

    @Query("SELECT COALESCE(SUM(t.amountPaid),0) FROM Transaction t WHERE t.type = 'VERSEMENT'")
    double sumVersements();
}

