package com.pizzastore.paymentservice.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.pizzastore.paymentservice.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Payment findByOrderId(int orderId);
}