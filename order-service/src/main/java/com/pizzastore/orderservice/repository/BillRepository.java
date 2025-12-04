package com.pizzastore.orderservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.pizzastore.orderservice.entity.Bill;

public interface BillRepository extends JpaRepository<Bill, Integer> {
    Bill findByOrderId(int orderId);

    // SQL Query to calculate Total Revenue for Admin
    @Query("SELECT SUM(b.totalAmount) FROM Bill b")
    Double getTotalRevenue();
}