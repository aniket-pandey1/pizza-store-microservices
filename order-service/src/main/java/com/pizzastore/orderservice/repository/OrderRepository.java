package com.pizzastore.orderservice.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.pizzastore.orderservice.entity.Order;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByUserEmail(String userEmail); // Find orders for a specific user
}