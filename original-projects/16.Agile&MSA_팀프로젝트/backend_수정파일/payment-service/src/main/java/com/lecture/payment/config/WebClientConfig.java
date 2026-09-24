package com.lecture.payment.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    /**
     * Eureka 로드밸런싱 WebClient
     * lb://service-name 형식으로 서비스 탐색
     * (enrollment-service 의 WebClientConfig 패턴과 동일)
     */
    @Bean
    @LoadBalanced
    public WebClient.Builder loadBalancedWebClientBuilder() {
        return WebClient.builder();
    }
}
