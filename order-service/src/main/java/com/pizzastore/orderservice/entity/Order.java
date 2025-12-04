package com.pizzastore.orderservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int orderId;

    private String userEmail; // To know WHO ordered
    private String pizzaName; // To know WHAT they ordered
    private String status;    // Pending, Delivered, etc.
    private double price;
    
    private LocalDateTime orderDate;

    public Order() {
        this.orderDate = LocalDateTime.now();
        this.status = "Pending";
    }

    // Getters and Setters
    public int getOrderId() { return orderId; }
    public void setOrderId(int orderId) { this.orderId = orderId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getPizzaName() { return pizzaName; }
    public void setPizzaName(String pizzaName) { this.pizzaName = pizzaName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
}