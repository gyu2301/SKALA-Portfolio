package com.lecture.enrollment.repository;

import com.lecture.enrollment.entity.ProcessedEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessedEventRepository extends JpaRepository<ProcessedEvent, ProcessedEvent.Pk> {
}
