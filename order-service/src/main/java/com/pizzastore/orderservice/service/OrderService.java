package com.pizzastore.orderservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.pizzastore.orderservice.entity.Bill;
import com.pizzastore.orderservice.entity.Order;
import com.pizzastore.orderservice.repository.BillRepository;
import com.pizzastore.orderservice.repository.OrderRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private BillRepository billRepository;

    // Notification Interface REMOVED

    public String placeOrder(Order order) {
        // 1. Save Order
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("Placed");
        Order savedOrder = orderRepository.save(order);

        // 2. Save Bill
        Bill bill = new Bill(savedOrder.getOrderId(), savedOrder.getPrice());
        billRepository.save(bill);

        // 3. Email Logic REMOVED
        System.out.println("Order saved successfully without email for ID: " + savedOrder.getOrderId());

        return "Order Placed Successfully! Bill Generated with ID: " + bill.getBillId();
    }

    // Admin: Get All Orders
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    // User: Get My Orders
    public List<Order> getOrdersByUser(String email) {
        return orderRepository.findByUserEmail(email);
    }
}