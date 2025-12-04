package com.pizzastore.pizzaservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "pizzas")
public class Pizza {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pizza_id")
    private int pizzaId;

    @Column(name = "item_name")
    private String itemName;

    private String category; // e.g., Veg, Non-Veg
    
    private BigDecimal price;
    
    private String size; // Small, Medium, Large

    // Constructors
    public Pizza() {}

    public Pizza(String itemName, String category, BigDecimal price, String size) {
        this.itemName = itemName;
        this.category = category;
        this.price = price;
        this.size = size;
    }

    // Getters and Setters
    public int getPizzaId() { return pizzaId; }
    public void setPizzaId(int pizzaId) { this.pizzaId = pizzaId; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
}