package com.pizzastore.orderservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Integer orderItemId;

    @Column(name = "menu_id")
    private Integer menuId; 

    private Integer qty;
    
    @Column(name = "unit_price")
    private BigDecimal unitPrice;

    // --- NEW FIELD ADDED TO FIX SQL ERROR ---
    @Column(name = "total_price")
    private BigDecimal totalPrice;

    @ManyToOne
    @JoinColumn(name = "order_id")
    @JsonIgnore 
    private Order order;

    // --- MANUAL GETTERS & SETTERS ---
    public Integer getOrderItemId() { return orderItemId; }
    public void setOrderItemId(Integer orderItemId) { this.orderItemId = orderItemId; }
    
    public Integer getMenuId() { return menuId; }
    public void setMenuId(Integer menuId) { this.menuId = menuId; }
    
    public Integer getQty() { return qty; }
    public void setQty(Integer qty) { this.qty = qty; }
    
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    // --- NEW GETTER & SETTER ---
    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }
    
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
}