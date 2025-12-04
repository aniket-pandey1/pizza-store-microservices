package com.pizzastore.pizzaservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.pizzastore.pizzaservice.entity.Pizza;

public interface PizzaRepository extends JpaRepository<Pizza, Integer> {
    // We can add custom search methods later, like findByCategory
}