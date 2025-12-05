package com.pizzastore.adminservice.repository;

import com.pizzastore.adminservice.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Integer> {
    
    // We are querying the ORDERS table from the MenuRepository for convenience.
    // This calculates the sum of all 'total_amount' where payment_status is 'PAID'.
    @Query(value = "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'PAID'", nativeQuery = true)
    BigDecimal calculateTotalRevenue();
}