package com.pizzastore.monolith;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.pizzastore.monolith.entity")
@EnableJpaRepositories("com.pizzastore.monolith.repository")
public class PizzaMonolithApplication {
    public static void main(String[] args) {
        SpringApplication.run(PizzaMonolithApplication.class, args);
    }
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
