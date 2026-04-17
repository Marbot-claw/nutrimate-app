# Nutrimate App - Technical Documentation

> **Status:** Active Development
> **Last Updated:** April 18, 2026

---

## 1. Executive Summary
Nutrimate App is a robust backend service built with **NestJS** and **TypeScript**, leveraging **TypeORM** for PostgreSQL database interactions. This repository serves as the core engine for user management, authentication, and nutrition-related profile data.

## 2. Technical Stack
| Component | Technology |
| :--- | :--- |
| **Framework** | [NestJS](https://nestjs.com/) |
| **Language** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | TypeORM |
| **Authentication** | JWT, API Key (Internal) |
| **Security** | `bcrypt` (password hashing) |

## 3. Core Architecture
The application follows a modular architecture, promoting separation of concerns and maintainability.

### 3.1. Key Modules
*   **`auth`**: Handles user registration, login, and JWT strategy implementation.
*   **`users`**: Manages user entities, profiles, and associated business logic.
*   **`user-body-profile`**: Tracks and updates body-related metrics for users.
*   **`internal`**: Exposes protected endpoints for internal service communication, secured via API keys.
*   **`common`**: Contains shared utilities, such as `ResponseEnvelopeInterceptor` for consistent API response structures.

## 4. Security Measures
*   **Authentication**: Implements both JWT-based auth for end-users and API Key-based auth for internal service-to-service communication.
*   **Data Privacy**: Sensitive fields (e.g., `password`) are explicitly excluded from database query results in standard operations to prevent accidental data leakage.
*   **Hashing**: Uses `bcrypt` for secure password storage.

## 5. Development Guidelines
### 5.1. Database Migrations
Migrations are located in `src/database/migrations/`. Always ensure that new schema changes are accompanied by a corresponding migration file.

### 5.2. Coding Standards
*   Follow the existing `eslint` and `prettier` configurations.
*   Use DTOs (Data Transfer Objects) for input validation.
*   Keep business logic within `Service` classes; controllers should handle request routing and response handling only.

---
*For more information, please refer to the `README.md` in the root directory.*
