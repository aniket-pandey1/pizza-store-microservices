Pizza Store - Microservices Capstone Project

---Project Overview

The Pizza Store application is a comprehensive, full-stack e-commerce platform designed using a Microservices Architecture. It allows customers to browse a menu, customize orders, add items to a cart, and securely checkout using a simulated payment gateway. Administrators have a dedicated dashboard to manage the menu, view orders, and track revenue.

This project demonstrates the implementation of a distributed system using Spring Boot, Spring Cloud, Eureka, MySQL, and a responsive HTML/JavaScript frontend.

---Key Features

1- Customer Features

User Authentication: Secure Registration and Login (JWT & BCrypt).

Menu Browsing: View pizzas, sides, and beverages with filtering (Veg/Non-Veg) and sorting (Price Low-High).

Shopping Cart: Add items, update quantities, and remove items.

Checkout Flow: Two-step process: Place Order -> Select Payment Mode (Card, UPI, COD).

Order History: View past orders and their current status.

Order Cancellation: Cancel placed orders (triggers revenue refund).

Email Notifications: Receive real-time email updates for order placement and status changes.

2- Admin Features

Secure Login: Dedicated admin authentication.

Dashboard: Centralized view for management tasks.

Menu Management (CRUD): Add, Update, and Delete menu items.

Order Management: View all active orders and Accept/Reject them.

User Management (CRUD): View, Edit, and Delete user accounts.

Revenue Tracking: Real-time calculation of total revenue from paid orders.

3- Microservices Architecture

The application is decomposed into the following independently deployable services:

Service Name

Port

Description

Service Registry

8761

Eureka Server. Acts as the discovery server for all microservices to register and find each other.

User Service

8081

Handles User Registration, Login (JWT generation), and User CRUD operations. Connects to the users table.

Admin Service

8082

Manages Menu items and calculates Revenue. Acts as a client to User/Order services for management tasks.

Order Service

8083

Core logic for Placing Orders, Cart management, and Checkout flow. Orchestrates Payment and Notification calls.

Notification Service

8084

A dedicated service for sending emails via SMTP (Gmail).

Payment Service

8085

Simulates an external payment gateway. Processes transactions and returns success/failure status.

4- Tech Stack

Backend: Java 17+, Spring Boot 3.2.x

Microservices: Spring Cloud Netflix Eureka, RestTemplate, Spring Security

Database: MySQL 8.0+ (Single database pizzastore shared for simplicity, or separate DBs per service)

Security: JWT (JSON Web Tokens), BCrypt Password Hashing

Frontend: HTML5, CSS3, Vanilla JavaScript (Fetch API)

Build Tool: Maven

Email: Java Mail Sender (Gmail SMTP)

5- Setup & Installation

Prerequisites

Java 17 or higher installed.

Maven installed.

--MySQL Server installed and running.

1. Database Setup

Open MySQL Workbench or your preferred SQL tool.

Create a database named pizzastore.

Run the provided SQL script pizza_complete_db.sql to create tables and insert seed data.

2. Clone the Repository

git clone [https://github.com/your-username/pizza-store-capstone.git](https://github.com/your-username/pizza-store-capstone.git)
cd pizza-store-capstone


3. Configure Services

Navigate to each service's src/main/resources/application.properties and update your MySQL username and password:

spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD


Update the notification-service properties with your Email App Password if you want real emails.

4. Run the Application

Start the services in the following specific order:

Service Registry (service-registry) - Wait for it to start completely.

User Service (user-service)

Admin Service (admin-service)

Order Service (order-service)

Notification Service (notification-service)

Payment Service (payment-service)

You can run them via your IDE (Right-click -> Run as Java Application) or using Maven:

mvn spring-boot:run


5. Access the Frontend

Navigate to the pizza-frontend folder.

Open index.html in any modern web browser.

--- Usage Guide

Customer Flow

Register: Create a new account on the home page.

Login: Use your new credentials.

Shop: Browse the menu, add items to the cart.

Checkout: Click "Place Order", then select a payment method (e.g., "Card").

Verify: Check your email for the order confirmation.

Admin Flow

Login: Click "Admin Login" and use the admin credentials (default: admin / admin123 or as configured).

Manage: Use the dashboard buttons to add menu items, view revenue, or accept pending orders.
