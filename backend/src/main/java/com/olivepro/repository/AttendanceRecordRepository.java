package com.olivepro.repository;

import com.olivepro.domain.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByEmployeeIdAndDateBetween(Long employeeId, LocalDate from, LocalDate to);
    Optional<AttendanceRecord> findByEmployeeIdAndDate(Long employeeId, LocalDate date);
}

