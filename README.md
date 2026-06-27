<div align="center">
  <img src="src/main/resources/static/images/logo.png" alt="Trust Ledger Logo" width="200"/>
  <h1>Trust Ledger - Gold Loan Management System</h1>
</div>

Trust Ledger is a comprehensive, full-stack web application built to manage operations for a small gold finance office or pawn shop. It provides a secure platform to manage customers, track loans, calculate monthly interest, process payments, and generate professional PDF receipts.

## Screenshots

### Shop Owner Dashboard
<img width="700" alt="image" src="https://github.com/user-attachments/assets/df15eb0f-7744-48f6-93c4-f3ec0b3fba02" />
<br><br>
<img width="700" alt="image" src="https://github.com/user-attachments/assets/e4fe190a-95c8-498b-a09c-49adc3093e92" />
<br><br>
<img width="700" alt="image" src="https://github.com/user-attachments/assets/ac60a304-30c6-45d4-bead-da79b302d9ca" />
<br><br>
<img width="700" alt="image" src="https://github.com/user-attachments/assets/0839ebbf-48c7-4813-ad4d-f26dee315b30" />


### Customer Loan Details

<img width="700" alt="image" src="https://github.com/user-attachments/assets/73c2fecf-5e36-4d67-bb88-02d463453765" />
<br><br>
<img width="700" alt="image" src="https://github.com/user-attachments/assets/40485902-7225-480f-aa95-affe8cd2018d" />
<br><br>
<img width="700" alt="image" src="https://github.com/user-attachments/assets/c0cd8c58-0838-4cbd-b977-cf2840e9aa0b" />
<br><br>
<img width="700" alt="image" src="https://github.com/user-attachments/assets/5cc60338-103c-43b3-a9b8-a16c939fb3eb" />


## Features

- **Secure Login**: Access controlled via Spring Security (JWT Tokens).
- **Dashboard**: Real-time summary of total customers, active/overdue/closed loans, and collected interest.
- **Customer Portal**: Customers can log in with their phone number and password to view their active loans and make online payments.
- **Razorpay Integration**: Customers can pay their interest and principal online seamlessly through Razorpay.
- **Professional PDF Receipts**: Generates beautiful, brand-colored PDF receipts using iTextPDF upon every successful payment.
- **Smart Payment Rollover**: Automatically handles overpayments (e.g. paying more interest than owed automatically reduces the principal balance).
- **Loan Management**: 
  - Manage multiple loans per customer.
  - Record gold item details (Type, Weight, Purity, Estimated Value).
  - Track loan statuses: `ACTIVE`, `OVERDUE`, `AUCTION_ELIGIBLE`, `CLOSED`.

## Technologies Used

### Backend
- **Java 21**
- **Spring Boot 3.2.x** (Spring MVC, Spring Data JPA)
- **Spring Security + JWT**
- **MySQL** (Relational Database)
- **iTextPDF** (For generating professional receipts)

### Frontend
- **HTML5**
- **CSS3** (Vanilla CSS, custom properties for a premium UI)
- **JavaScript** (Vanilla JS, Fetch API)
- **Razorpay JS**

## Database Setup

1. Install MySQL Server.
2. Create the database:
   ```sql
   CREATE DATABASE trust_ledger;
   ```
3. Update your database configuration securely in your environment or local properties.

## How to Run the Project

1. Clone or download the repository.
2. Open the project in your preferred IDE.
3. Ensure Maven dependencies are downloaded and synced.
4. Run the `TrustLedgerApplication.java` main class.
5. The application will start on port `8080`.
6. Open your web browser and navigate to: 
   - **Shop Owner Login:** [http://localhost:8080/shop-owner/shop-login.html](http://localhost:8080/shop-owner/shop-login.html)
   - **Customer Login:** [http://localhost:8080/customer/customer-login.html](http://localhost:8080/customer/customer-login.html)

## Login Details

On first startup, the application automatically provisions a default administrator account.

- **Username**: `admin`
- **Password**: `admin`
