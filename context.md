# Budget Tracker – Project Context

## Overview

This is a full‑stack expense tracking application.

The frontend is a React single‑page app (Create React App). The backend is an AWS Lambda function that acts as an API layer, manages the underlying infrastructure (an EC2 instance + database), and handles CRUD operations for expenses, users, and categories.

All communication between frontend and backend happens through a single HTTP endpoint (`/budget`). Every API call sends a JSON payload with an `action` field telling the Lambda which operation to perform.

## Tech Stack

- **Frontend**: React (JavaScript), CSS, Recharts (charts), date‑fns (date helpers), Axios (HTTP client)
- **Backend**: Python 3, AWS Lambda, boto3, PyMySQL
- **Database**: SQL database managed inside the backend (configured via environment / SSM parameters)
- **Infrastructure**: AWS EC2 instance (stopped when idle to reduce cost)

## Repository Structure (relevant files)

| Path | Purpose |
|------|---------|
| `src/App.js` | Root component; holds top‑level page state, date range, filter state, and infrastructure stop logic. |
| `src/hooks/useBaseData.js` | Loads and caches users and categories. |
| `src/hooks/useExpenses.js` | Loads expense list for the selected date range. |
| `src/services/api.js` | All backend API functions. |
| `src/utils/dateHelpers.js` | Date helpers for month boundaries, formatting, and display labels. |
| `src/utils/dataHelpers.js` | Helpers to convert user/category IDs to display names. |
| `src/utils/chartColors.js` | Color palettes and mapping of category names to chart colors. |
| `src/components/Dashboard/Dashboard.js` | Dashboard page with stats and charts. Uses `filteredExpenses`, `users`, `categories`, and `dateRange`. |
| `src/components/Expenses/AddExpense.js` | Form for adding a new expense. |
| `src/components/Expenses/ExpenseList.js` | Table + modal for viewing, editing, and deleting expenses. Allows filtering, sorting, and pagination. |
| `src/components/Categories/CategoryManager.js` | UI for managing categories. |
| `src/components/Users/UserManager.js` | UI for managing users. |
| `src/components/Dashboard/charts/*` | Individual chart components (CategoryChart, UserChart, DayWiseChart, UserCategoryChart, etc.). |
| `src/components/Common/*` | Reusable modal, form field, calendar picker. |
| `lambda/lambda_function.py` | AWS Lambda handler and infrastructure manager. |
| `package.json` | Frontend dependencies and scripts. |

## High‑Level Architecture

