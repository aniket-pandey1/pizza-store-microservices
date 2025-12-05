package com.pizzastore.adminservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate; // NEW IMPORT

@SpringBootApplication
@EnableDiscoveryClient
public class AdminServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(AdminServiceApplication.class, args);
	}

    // Bean to allow inter-service communication (Admin to User Service)
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}