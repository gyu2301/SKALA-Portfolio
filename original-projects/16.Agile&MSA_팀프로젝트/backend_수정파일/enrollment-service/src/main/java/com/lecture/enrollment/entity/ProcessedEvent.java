package com.lecture.enrollment.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Kafka 컨슈머 멱등 게이트 (#14)
 * init-db/03_sprint2.sql 의 processed_events 테이블에 매핑
 * — (event_id, consumer_group) PK 로 같은 이벤트의 중복 처리를 차단한다
 */
@Entity
@Table(name = "processed_events")
@IdClass(ProcessedEvent.Pk.class)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessedEvent {

    @Id
    @Column(name = "event_id", length = 64)
    private String eventId;

    @Id
    @Column(name = "consumer_group", length = 50)
    private String consumerGroup;

    @Column(name = "processed_at", nullable = false)
    private LocalDateTime processedAt;

    public static ProcessedEvent of(String eventId, String consumerGroup) {
        return ProcessedEvent.builder()
                .eventId(eventId)
                .consumerGroup(consumerGroup)
                .processedAt(LocalDateTime.now())
                .build();
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class Pk implements Serializable {
        private String eventId;
        private String consumerGroup;
    }
}
