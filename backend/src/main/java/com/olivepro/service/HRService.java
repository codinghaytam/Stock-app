package com.olivepro.service;

import com.olivepro.domain.*;
import com.olivepro.dto.request.*;
import com.olivepro.dto.response.SalaryCalculationResponse;
import com.olivepro.enums.*;
import com.olivepro.exception.ResourceNotFoundException;
import com.olivepro.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class HRService {

    private static final Logger log = LoggerFactory.getLogger(HRService.class);

    private final EmployeeRepository empRepo;
    private final AttendanceRecordRepository attendanceRepo;
    private final SalaryPaymentRepository salaryRepo;
    private final ActivityLogService logService;
    private final AccountingService accountingService;

    public HRService(EmployeeRepository empRepo, AttendanceRecordRepository attendanceRepo,
                     SalaryPaymentRepository salaryRepo, ActivityLogService logService,
                     AccountingService accountingService) {
        this.empRepo = empRepo; this.attendanceRepo = attendanceRepo;
        this.salaryRepo = salaryRepo; this.logService = logService;
        this.accountingService = accountingService;
    }

    public List<Employee> getEmployees() { return empRepo.findByIsActiveTrue(); }

    @Transactional
    public Employee createEmployee(EmployeeRequest req, String username) {
        Employee e = Employee.builder().fullName(req.getFullName()).role(req.getRole())
                .baseSalary(req.getBaseSalary()).phone(req.getPhone()).hireDate(req.getHireDate()).build();
        logService.log(username, "RH", "Nouvel employé: " + req.getFullName(), null);
        return empRepo.save(e);
    }

    @Transactional
    public Employee updateEmployee(Long id, EmployeeRequest req, String username) {
        Employee e = empRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + id));
        e.setFullName(req.getFullName()); e.setRole(req.getRole());
        e.setBaseSalary(req.getBaseSalary()); e.setPhone(req.getPhone());
        logService.log(username, "RH", "Mise à jour employé: " + req.getFullName(), null);
        return empRepo.save(e);
    }

    @Transactional
    public void deactivateEmployee(Long id, String username) {
        Employee e = empRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + id));
        e.setActive(false);
        empRepo.save(e);
        logService.log(username, "RH", "Désactivation: " + e.getFullName(), null);
    }

    @Transactional
    public AttendanceRecord markAttendance(AttendanceRequest req, String username) {
        Employee emp = empRepo.findById(req.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + req.getEmployeeId()));
        var existing = attendanceRepo.findByEmployeeIdAndDate(req.getEmployeeId(), req.getDate());
        AttendanceRecord rec = existing.orElse(AttendanceRecord.builder().employee(emp).date(req.getDate()).build());
        rec.setStatus(req.getStatus()); rec.setOvertimeHours(req.getOvertimeHours());
        rec.setAdvanceAmount(req.getAdvanceAmount()); rec.setNotes(req.getNotes());
        return attendanceRepo.save(rec);
    }

    @Transactional
    public AttendanceRecord updateAttendance(Long id, AttendanceRequest req, String username) {
        AttendanceRecord rec = attendanceRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Attendance not found: " + id));
        rec.setStatus(req.getStatus()); rec.setOvertimeHours(req.getOvertimeHours());
        rec.setAdvanceAmount(req.getAdvanceAmount()); rec.setNotes(req.getNotes());
        logService.log(username, "RH", "Mise à jour présence: " + rec.getEmployee().getFullName(), null);
        return attendanceRepo.save(rec);
    }

    public List<AttendanceRecord> getAttendance(Long employeeId, LocalDate from, LocalDate to) {
        return attendanceRepo.findByEmployeeIdAndDateBetween(employeeId, from, to);
    }

    public SalaryCalculationResponse calculateSalary(Long employeeId, LocalDate from, LocalDate to) {
        Employee emp = empRepo.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + employeeId));
        List<AttendanceRecord> records = attendanceRepo.findByEmployeeIdAndDateBetween(employeeId, from, to);
        double gross = 0;
        double overtime = 0;
        int daysPresent = 0;
        double advances = 0;
        for (AttendanceRecord r : records) {
            double coeff = r.getStatus().coefficient();
            if (emp.getRole() == EmployeeRole.OUVRIER) {
                gross += emp.getBaseSalary() * coeff;
            }
            overtime += r.getOvertimeHours();
            if (coeff > 0) daysPresent++;
            advances += r.getAdvanceAmount();
        }
        if (emp.getRole() == EmployeeRole.EMPLOYE) gross = emp.getBaseSalary();
        // Overtime = 1.5x hourly rate (hourly = baseSalary / 208 for monthly employees)
        double hourlyRate = emp.getRole() == EmployeeRole.EMPLOYE ? emp.getBaseSalary() / 208 : emp.getBaseSalary() / 8;
        gross += overtime * hourlyRate * 1.5;
        double net = gross - advances;
        String period = from.toString() + " / " + to.toString();
        return new SalaryCalculationResponse(employeeId, emp.getFullName(), period, gross, advances, net, daysPresent, overtime);
    }

    @Transactional
    public void deleteSalary(Long id, String username) {
        salaryRepo.deleteById(id);
        logService.log(username, "Salaire", "Suppression id=" + id, null);
    }

    @Transactional
    public SalaryPayment paySalary(SalaryPaymentRequest req, String username) {
        Employee emp = empRepo.findById(req.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + req.getEmployeeId()));
        SalaryPayment p = SalaryPayment.builder()
                .employee(emp).period(req.getPeriod()).grossAmount(req.getNetAmount() + req.getDeductions())
                .deductions(req.getDeductions()).netAmount(req.getNetAmount())
                .paymentMethod(req.getPaymentMethod()).paymentStatus(req.getPaymentStatus())
                .bankAccountId(req.getBankAccountId()).notes(req.getNotes())
                .paidAt(java.time.LocalDateTime.now()).createdBy(username).build();
        if (req.getPaymentStatus() == PaymentStatus.PAYE) {
            if (req.getPaymentMethod() == PaymentMethod.ESPECE) {
                accountingService.createExpense(new ExpenseRequest() {{
                    setDescription("Salaire - " + emp.getFullName()); setAmount(req.getNetAmount());
                    setCategory(ExpenseCategory.SALAIRES); setPaymentMethod(PaymentMethod.ESPECE);
                    setDate(LocalDate.now());
                }}, username);
            } else if (req.getPaymentMethod() == PaymentMethod.VIREMENT && req.getBankAccountId() != null) {
                accountingService.updateBalance(req.getBankAccountId(), -req.getNetAmount());
            }
        }
        logService.log(username, "Salaire", "Paiement " + emp.getFullName() + " " + req.getNetAmount() + " DH", req.getNetAmount());
        return salaryRepo.save(p);
    }

    public List<SalaryPayment> getSalaryPayments(Long employeeId) {
        return employeeId != null ? salaryRepo.findByEmployeeId(employeeId) : salaryRepo.findAll();
    }
}

