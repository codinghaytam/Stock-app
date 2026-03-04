package com.olivepro.repository;

import com.olivepro.domain.SalaryPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SalaryPaymentRepository extends JpaRepository<SalaryPayment, Long> {
    List<SalaryPayment> findByEmployeeId(Long employeeId);
    List<SalaryPayment> findByEmployeeIdAndPeriod(Long employeeId, String period);
}

