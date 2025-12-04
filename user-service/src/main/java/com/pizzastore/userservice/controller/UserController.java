package com.pizzastore.userservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.pizzastore.userservice.entity.User;
import com.pizzastore.userservice.repository.UserRepository;
import java.util.Map;

@RestController
@RequestMapping("/user")
//@CrossOrigin(origins = "*") // 1. Force CORS here as well
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        String email = loginData.get("email");
        String password = loginData.get("password");

        // 2. PRINT TO CONSOLE (Debug)
        System.out.println("--- LOGIN ATTEMPT ---");
        System.out.println("Email: " + email);
        System.out.println("Password: " + password);

        User user = userRepository.findByEmail(email);

        if (user == null) {
            System.out.println("RESULT: User not found in Database!");
            return ResponseEntity.status(401).body("User not found");
        }

        if (user.getPassword().equals(password)) {
            System.out.println("RESULT: Login Success!");
            // Return a simple JSON to keep frontend happy
            return ResponseEntity.ok(Map.of("message", "Login Successful", "token", "dummy-token"));
        } else {
            System.out.println("RESULT: Wrong Password!");
            return ResponseEntity.status(401).body("Invalid Credentials");
        }
    }
    
    // Add a simple test endpoint
    @GetMapping("/test")
    public String test() {
        return "User Service is Working!";
    }
}