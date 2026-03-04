package com.olivepro.repository;
import com.olivepro.domain.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {}

