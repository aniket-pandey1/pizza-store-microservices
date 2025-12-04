package com.pizzastore.pizzaservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.pizzastore.pizzaservice.entity.Pizza;
import com.pizzastore.pizzaservice.repository.PizzaRepository;
import java.util.List;

@RestController
@RequestMapping("/pizza")
//@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE}) 
public class PizzaController {

    @Autowired
    private PizzaRepository pizzaRepository;

    @GetMapping("/test")
    public String test() {
        return "Pizza Service is up and running!";
    }

    // 1. Add Pizza
    @PostMapping("/add")
    public String addPizza(@RequestBody Pizza pizza) {
        pizzaRepository.save(pizza);
        return "Pizza added successfully!";
    }

    // 2. Get All Pizzas
    @GetMapping("/all")
    public List<Pizza> getAllPizzas() {
        return pizzaRepository.findAll();
    }
    
    // 3. Update Pizza (New Feature)
    @PutMapping("/update")
    public String updatePizza(@RequestBody Pizza pizza) {
        // JPA smart save: If ID exists, it updates. If ID is null, it inserts.
        pizzaRepository.save(pizza);
        return "Pizza updated successfully!";
    }

    // 4. Delete Pizza (New Feature)
    @DeleteMapping("/delete/{id}")
    public String deletePizza(@PathVariable int id) {
        pizzaRepository.deleteById(id);
        return "Pizza deleted successfully!";
    }
}