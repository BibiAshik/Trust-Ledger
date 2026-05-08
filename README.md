# Trust Ledger - Gold Loan Management System

Trust Ledger is a comprehensive, realistic full-stack web application built to manage operations for a small gold finance office or pawn shop. It provides a secure platform to manage customers, track loans, calculate monthly interest, process payments, and identify overdue or auction-eligible accounts.

## Features

- **Secure Login**: Access controlled via Spring Security (default credentials provided below).
- **Dashboard**: Real-time summary of total customers, active/overdue/closed loans, and total collected interest.
- **Customer Management**: Create and track customer profiles (Name, Phone, Aadhaar, Address).
- **Loan Management**: 
  - Manage multiple loans per customer.
  - Record gold item details (Type, Weight, Purity, Estimated Value).
  - Automatically calculate monthly interest based on remaining principal.
  - Handle partial interest payments (remaining carries forward).
  - Handle partial principal payments (interest recalculates).
  - Track loan statuses: `ACTIVE`, `OVERDUE`, `AUCTION_ELIGIBLE`, `CLOSED`.
- **Loan Renewals & Notes**: Extend loans, add internal notes for customer interactions.
- **Payment History**: Complete audit trail of all transactions (Interest, Principal, Full Closure).
- **Printable Receipts**: Generate simple, print-friendly HTML receipts.
- **Record Safety**: Soft status updates (Closed) instead of permanent record deletion.

## Technologies Used

### Backend
- **Java 21**
- **Spring Boot 3.5.x** (Spring MVC, Spring Data JPA)
- **Spring Security** (Session-based authentication)
- **MySQL** (Relational Database)
- **Lombok** (Boilerplate reduction)
- **Maven** (Dependency Management)

### Frontend
- **HTML5**
- **CSS3** (Vanilla CSS, Flexbox, Custom CSS Variables)
- **JavaScript** (Vanilla JS, Fetch API, DOM manipulation)

*Note: The frontend avoids heavy frameworks like React/Angular and complex CSS libraries like Tailwind to maintain a clean, beginner-friendly architecture.*

## Screenshots
*(Add screenshots of the Dashboard, Loan Details, and Customers list here)*

## Database Setup

1. Install MySQL Server.
2. Create the database:
   ```sql
   CREATE DATABASE trust_ledger;
   ```
3. For local MySQL, set these environment variables:
   ```properties
   DATABASE_URL=jdbc:mysql://localhost:3306/trust_ledger?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
   DATABASE_USERNAME=your_mysql_username
   DATABASE_PASSWORD=your_mysql_password
   ```

If these variables are not set, the application uses an embedded H2 database for quick demo/deployment testing.

## How to Run the Project

1. Clone or download the repository.
2. Open the project in your preferred IDE (IntelliJ IDEA, Eclipse, or VS Code).
3. Ensure Maven dependencies are downloaded and synced.
4. Run the `TrustLedgerApplication.java` main class.
5. The application will start on port `8080` by default.
6. Open your web browser and navigate to: `http://localhost:8080`

## Deployment

Build the production JAR:

```bash
mvn clean package
```

Run it with environment-based configuration:

```bash
java -jar target/trustledger-0.0.1-SNAPSHOT.jar
```

Or build and run with Docker:

```bash
docker build -t trust-ledger .
docker run -p 8080:8080 \
  -e DATABASE_URL="jdbc:mysql://host.docker.internal:3306/trust_ledger?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC" \
  -e DATABASE_USERNAME="root" \
  -e DATABASE_PASSWORD="root" \
  trust-ledger
```

For a complete local deployment with MySQL and the application together:

```bash
docker compose up --build
```

## Login Details

On first startup, the application automatically provisions a default administrator account.

- **Username**: `admin`
- **Password**: `admin`

## Future Improvements

- Add robust PDF generation for receipts instead of HTML printing.
- Implement daily-compounding interest logic for more precise financial tracking.
- Add granular role-based access control (RBAC) for Staff vs. Manager roles.
- Add an automated scheduled task (Cron Job) to run overdue checks nightly.
