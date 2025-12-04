package com.pizzastore.orderservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bills")
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int billId;
    
    private int orderId;
    private double basePrice;
    private double tax;     // 18% GST
    private double totalAmount;
    private LocalDateTime billDate;

    public Bill() {}

    public Bill(int orderId, double basePrice) {
        this.orderId = orderId;
        this.basePrice = basePrice;
        this.tax = basePrice * 0.18; // 18% Tax
        this.totalAmount = basePrice + this.tax;
        this.billDate = LocalDateTime.now();
    }

    // Getters and Setters
    public int getBillId() { return billId; }
    public void setBillId(int billId) { this.billId = billId; }

    public int getOrderId() { return orderId; }
    public void setOrderId(int orderId) { this.orderId = orderId; }

    public double getBasePrice() { return basePrice; }
    public void setBasePrice(double basePrice) { this.basePrice = basePrice; }

    public double getTax() { return tax; }
    public void setTax(double tax) { this.tax = tax; }

    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }

    public LocalDateTime getBillDate() { return billDate; }
    public void setBillDate(LocalDateTime billDate) { this.billDate = billDate; }
}