# Budget Tracker – Mermaid Diagrams

This file contains Mermaid diagrams that summarize the architecture and data flows described in `context.md`.

## High‑Level Architecture

```mermaid
graph LR
    A[React SPA] -- "HTTP POST /budget" --> B[API Gateway]
    B --> C[AWS Lambda]
    C -- "starts / stops / checks" --> D[EC2 Instance]
    D --> E[(MySQL Database)]
    C -- "reads DB password" --> F[SSM Parameter Store]
```

## Initial Load Sequence

```mermaid
sequenceDiagram
    participant UI as React SPA
    participant API as API Gateway (POST /budget)
    participant Lam as AWS Lambda
    participant DB as MySQL Database

    UI->>API: {action: "get_users"}
    UI->>API: {action: "get_categories"}
    UI->>API: {action: "get_expenses_by_date_range", startDate, endDate}

    API->>Lam: forward payload
    Lam->>Lam: cold_start_infrastructure() if needed
    Lam->>DB: SELECT queries
    DB-->>Lam: rows
    Lam-->>API: JSON response
    API-->>UI: data
```

## Expense CRUD Sequence (Add Expense Example)

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React SPA
    participant API as API Gateway
    participant Lam as AWS Lambda
    participant DB as MySQL Database

    U->>UI: Fill AddExpense form & submit
    UI->>API: POST /budget {action: "add_expense", UserId, CategoryId, Amount, Description}
    API->>Lam: forward payload
    Lam->>DB: INSERT INTO Expenses ...
    DB-->>Lam: success
    Lam-->>API: success response
    API-->>UI: success
    UI->>UI: alert("Expense added successfully")
    UI->>API: POST /budget {action: "get_expenses_by_date_range", ...}
    Note over UI,API: refresh expense list
```

## Database Schema

```mermaid
erDiagram
    USERS {
        int UserId PK
        varchar Name
        varchar Description
    }
    CATEGORIES {
        int CategoryId PK
        varchar CategoryName
        varchar Description
    }
    EXPENSES {
        int ExpenseId PK
        int UserId FK
        int CategoryId FK
        decimal Amount
        varchar Description
        timestamp Timestamp
    }

    USERS ||--o{ EXPENSES : "has"
    CATEGORIES ||--o{ EXPENSES : "categorizes"
```

## React Component Hierarchy

```mermaid
graph TD
    App[App] --> BaseDataHook[useBaseData]
    App --> ExpensesHook[useExpenses]
    App --> Dash[Dashboard]
    App --> ExpList[ExpenseList]
    App --> AddExp[AddExpense]
    App --> Users[UserManager]
    App --> Cats[CategoryManager]

    Dash --> StatCards[StatCards]
    Dash --> Charts[Charts]
    Dash --> Recent[Recent Expenses]

    ExpList --> Modal[Edit/Delete Modal]
    Users --> UserModal[User Edit/Delete Modal]
    Cats --> CatModal[Category Edit/Delete Modal]
```

## State Management Overview

```mermaid
graph LR
    App[App State] -->|currentPage| Pages[Page Rendering]
    App -->|dateRange| Expenses[useExpenses fetch]
    App -->|expenseFilter| ExpenseList[Initial Expense Filter]
    App -->|stoppingInfra| StopButton[Infra Stop Button]

    Expenses -->|expenses, loading, apiStatus| App
    BaseData[useBaseData] -->|users, categories| App
```