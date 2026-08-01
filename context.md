# Budget Tracker – Project Context

## Overview

-This is a full‑stack expense tracking application.
-
-The frontend is a React single‑page app (Create React App). The backend is an AWS Lambda function that acts as an API layer, manages the underlying infrastructure (an EC2 instance + database), and handles CRUD operations for expenses, users, and categories.
-
-All communication between frontend and backend happens through a single HTTP endpoint (`/budget`). Every API call sends a JSON payload with an `action` field telling the Lambda which operation to perform.
+This is a full-stack expense tracking application. Users can log expenses, view dashboards with charts, and manage users and categories. The frontend is a React single‑page application (Create React App); the backend is an AWS Lambda function that provides a REST‑like
API via a single `/budget` endpoint. The Lambda manages an EC2 instance (which hosts a MySQL/MariaDB database) and can start/stop it to save costs.

## Tech Stack

+- **Frontend**: React 18, JavaScript (JSX), Axios, Recharts, date-fns
-- **Backend**: Python 3, AWS Lambda, boto3, PyMySQL
-- **Database**: SQL database managed inside the backend (configured via environment / SSM parameters)
-- **Infrastructure**: AWS EC2 instance (stopped when idle to reduce cost)
+- **Frontend**: React 18, JavaScript (JSX), Axios, Recharts, date-fns
+- **Backend**: Python 3.9+ runtime, AWS Lambda, boto3, PyMySQL
+- **Infrastructure**: AWS EC2 instance, SSM Parameter Store for database password
+- **Database**: MySQL/MariaDB with database `budget`, user `budget_user`
+- **API Endpoint**: `https://ud407d2kwj.execute-api.ap-south-2.amazonaws.com/prod/budget`
+- **State Management**: Local React state, custom hooks (`useBaseData`, `useExpenses`)

-## Repository Structure (relevant files)
+## Repository Structure (key files)

| Path | Purpose |
 |------|---------|
+| `src/App.js` | Root component; owns page navigation, selected date range, expense filter, and infra stop state. |
+| `src/hooks/useBaseData.js` | Loads and caches users and categories; exposes refresh functions. |
+| `src/hooks/useExpenses.js` | Loads the expense list for the selected date range; exposes loading/api status/refetch. |
+| `src/services/api.js` | All API functions (expenses, users, categories, infra) that POST to `/budget`. |
+| `src/utils/dateHelpers.js` | Helpers for current/previous month boundaries, date formatting. |
+| `src/utils/dataHelpers.js` | Helpers to map `UserId`/`CategoryId` to display names. |
+| `src/utils/chartColors.js` | Color palette and mapping of category names to fixed colors. |
+| `src/components/Dashboard/Dashboard.js` | Dashboard page: stats cards, charts, and recent expense list. |
-| `src/components/Expenses/AddExpense.js` | Form for adding a new expense. |
-| `src/components/Expenses/ExpenseList.js` | Table + modal for viewing, editing, and deleting expenses. Allows filtering, sorting, and pagination. |
-| `src/components/Categories/CategoryManager.js` | UI for managing categories. |
-| `src/components/Users/UserManager.js` | UI for managing users. |
-| `src/components/Dashboard/charts/*` | Individual chart components (CategoryChart, UserChart, DayWiseChart, UserCategoryChart, etc.). |
-| `src/components/Common/*` | Reusable modal, form field, calendar picker. |
+| `src/App.js` | Root component; owns page navigation, selected date range, expense filter, and infra stop state. |
+| `src/hooks/useBaseData.js` | Loads and caches users and categories; exposes refresh functions. |
+| `src/hooks/useExpenses.js` | Loads the expense list for the selected date range; exposes loading/api status/refetch. |
+| `src/services/api.js` | All API functions (expenses, users, categories, infra) that POST to `/budget`. |
+| `src/utils/dateHelpers.js` | Helpers for current/previous month boundaries, date formatting. |
+| `src/utils/dataHelpers.js` | Helpers to map `UserId`/`CategoryId` to display names. |
+| `src/utils/chartColors.js` | Color palette and mapping of category names to fixed colors. |
+| `src/components/Dashboard/Dashboard.js` | Dashboard page: stats cards, charts, and recent expense list. |
+| `src/components/Expenses/ExpenseList.js` | Expense table with client‑side search, category/user filters, sorting, pagination, and edit/delete modal. |
+| `src/components/Expenses/AddExpense.js` | Form to add a new expense. |
+| `src/components/Users/UserManager.js` | CRUD UI for users. |
+| `src/components/Categories/CategoryManager.js` | CRUD UI for categories. |
| `lambda/lambda_function.py` | AWS Lambda handler and infrastructure manager. |
| `package.json` | Frontend dependencies and scripts. |

-## High‑Level Architecture
+## Data Flow

+### 1. Initial Load
+
+When `App` mounts:
+
+- `useBaseData()` is called.
+  - `useEffect` runs `fetchBaseData`.
+  - It fetches users and categories in parallel:
+    ```js
+    const [usersRes, categoriesRes] = await Promise.all([
+      userAPI.getUsers(),
+      categoryAPI.getCategories()
+    ]);
+    setUsers(usersRes.data.users || []);
+    setCategories(categoriesRes.data.categories || []);
+    ```
+  - If the request fails, it hardcodes dummy data:
+    ```js
+    setUsers([
+      { user_id: '1', name: 'John Doe', description: 'Primary user' },
+      { user_id: '2', name: 'Jane Smith', description: 'Secondary user' }
+    ]);
+    setCategories([
+      { category_id: '1', category_name: 'Food', ... },
+      { category_id: '2', category_name: 'Transport', ... }
+    ]);
+    ```
+    > **Note** : The fallback data uses lowercase snake_case keys (`user_id`, `category_name`), while the rest of the app expects PascalCase keys (`UserId`, `CategoryName`). This is a known inconsistency that only appears when the API is unavailable.
+
+- `useExpenses(dateRange)` is called.
+  - `dateRange` is initialized in `App` using `dateHelpers.getCurrentMonth()`:
+    ```js
+    { startDate: current.start, endDate: current.end }
+    ```
+  - `useExpenses` calls `expenseAPI.getExpensesByDateRange(dateRange.startDate, dateRange.endDate)`.
+  - On success, the returned `expenses` array is stored and `apiStatus` becomes `'connected'`.
+  - On error, it sets `apiStatus` to `'error'`, shows an alert, and uses built‑in `SAMPLE_EXPENSES` (which also uses `expense_id`, `amount`, `category_name`, etc., again mismatching the PascalCase fields used elsewhere).
+
+- `App` computes `filteredExpenses`:
+  ```js
+  const filteredExpenses = useMemo(() => {
+    if (!dateRange) return expenses;
+    return expenses.filter(expense => {
+      if (!expense.Timestamp) return false;
+      const expenseDate = expense.Timestamp.slice(0, 10);
+      return expenseDate >= dateRange.startDate && expenseDate <= dateRange.endDate;
+    });
+  }, [expenses, dateRange]);
+  ```
+  This ensures that even if the backend returns expenses outside the requested range, only those inside the selected dates are used.
+
+### 2. Page Navigation and Filtering
+
+- `App` stores `currentPage` (`'dashboard'`, `'expenses'`, `'add-expense'`, `'users'`, `'categories'`).
+- `handleNavigate(page, filter)` updates `currentPage` and `expenseFilter`.
+- Sidebar buttons call `handleNavigate` with the page name.
+- When clicking a chart bar on the dashboard, `handleCategoryClick`/`handleUserClick` call `onNavigate('expenses', { type: 'category', value: categoryId })` or `{ type: 'user', value: userId }`.
+- `ExpenseList` receives `initialFilter` and uses it to pre‑select the category/user filter dropdowns.
+
+### 3. CRUD Flows
+
+#### Adding an Expense
+
+- `AddExpense` has local state:
+  ```js
+  const [userId, setUserId] = useState('');
+  const [categoryId, setCategoryId] = useState('');
+  const [amount, setAmount] = useState('');
+  const [description, setDescription] = useState('');
+  ```
+- On submit it calls `expenseAPI.addExpense(parseInt(userId), parseInt(categoryId), parseFloat(amount), description)`.
+- After success:
+  - alerts `'Expense added successfully'`
+  - clears the form fields
+  - calls `onExpenseAdded()` (which is `fetchExpenses` from `useExpenses`).
+
+#### Editing / Deleting an Expense
+
+- `ExpenseList` local state:
+  ```js
+  const [selectedExpense, setSelectedExpense] = useState(null);
+  const [editForm, setEditForm] = useState({ UserId: '', CategoryId: '', Amount: '', Description: '' });
+  ```
+- Clicking an expense row opens a modal and populates `editForm` with the expense’s `UserId`, `CategoryId`, `Amount`, and `Description`.
+- **Save** calls `expenseAPI.updateExpense(selectedExpense.ExpenseId, editForm.UserId, editForm.CategoryId, editForm.Amount, editForm.Description)`.
+- **Delete** calls `expenseAPI.deleteExpense(selectedExpense.ExpenseId)`.
+- Both operations call `await onRefresh()` afterward (the `fetchExpenses` function).
+
+#### Managing Users
+
+- `UserManager` local state:
+  - `selectedUser` – user being edited/deleted
+  - `editName`, `editDescription`
+  - `newName`, `newDescription`
     +- **Add** calls `userAPI.addUser(newName, newDescription)`.
     +- **Save** calls `userAPI.updateUser(selectedUser.UserId, editName, editDescription)`.
     +- **Delete** calls `userAPI.deleteUser(userId)` and uses the backend response `data.deleted_expenses` to show how many associated expenses were removed.
     +- After any operation it calls `onRefresh()` and `onUserChange?.()`.
+
+#### Managing Categories
+
+- `CategoryManager` behaves the same as `UserManager` but for categories.
+- It calls `categoryAPI.addCategory`, `categoryAPI.updateCategory`, `categoryAPI.deleteCategory`.
+- After any operation it calls `onRefresh()` and `onCategoryChange?.()`.
+
+### 4. Infrastructure Stop Flow
+
+- `App` shows a “Stop AWS Infra” button when `apiStatus === 'connected'`.
+- Clicking it calls `handleStopInfra`, which:
+  1. Asks for confirmation.
+  2. Sets `stoppingInfra = true`.
+  3. Calls `stopInfraAPI()`.
+  4. Alerts with the response message.
+  5. Sets `stoppingInfra = false` in `finally`.
+
+## State Management
+
+### App‑Level State (`src/App.js`)
+
+| State | Type | Purpose |
+|-------|------|---------|
+| `currentPage` | `string` | Defines which page component is rendered. |
+| `dateRange` | `{ startDate, endDate }` | Selected month/date range. |
+| `stoppingInfra` | `boolean` | Disables the infra stop button while a stop request is in flight. |
+| `expenseFilter` | `{ type: 'category' \| 'user', value: number }` \| `null` | Set when navigating from chart clicks to the expense list. |
+
+### Custom Hooks
+
+#### `useBaseData`
+


const { users, categories, refreshUsers, refreshCategories } = useBaseData();




- `users`: array of user objects.

- `categories`: array of category objects.

- `refreshUsers`: re-fetches users and updates state.

- `refreshCategories`: re-fetches categories and updates state.



#### `useExpenses`


const { expenses, loading, apiStatus, fetchExpenses } = useExpenses(dateRange);




- `expenses`: array of expense objects returned from the API.

- `loading`: `true` while a fetch is in progress.

- `apiStatus`: `'connecting'` | `'connected'` | `'error'`.

- `fetchExpenses`: async function that re‑runs the query for `dateRange`.



### Component‑Local State



- **`ExpenseList`**:

  - Modal state: `selectedExpense`, `editForm`.

  - Filter/pagination/sort state: `searchText`, `categoryFilter`, `userFilter`, `sortField`, `sortDirection`, `currentPage`, `itemsPerPage`.

  - Derived data: `processedExpenses` (after search/filter/sort) and `paginatedExpenses`.



- **`AddExpense`**: `userId`, `categoryId`, `amount`, `description`.



- **`UserManager`**: `selectedUser`, `editName`, `editDescription`, `newName`, `newDescription`.



- **`CategoryManager`**: `selectedCategory`, `editCategoryName`, `editDescription`, `newCategoryName`, `newDescription`.



- **`Dashboard`**: no local state; uses `useMemo` to derive chart data from its props.



## Callback Registry



| Callback | Passed From | Triggered By | Purpose |

|----------|-------------|--------------|---------|

| `onNavigate(page, filter?)` | `App` → Dashboard, sidebar, etc. | Page buttons, chart clicks | Changes current page and optional expense filter. |

| `onRefresh()` | `App` → Dashboard, ExpenseList, UserManager, CategoryManager | Refresh button, after CRUD | Calls `fetchExpenses` to reload the expense list. |

| `onDateChange(newRange)` | `App` → CalendarPicker | Date picker change | Updates `dateRange` in `App`. |

| `onExpenseAdded()` | `App` → AddExpense | After successful add | Calls `fetchExpenses` to refresh the list. |

| `onUserChange()` | `App` → UserManager | After user CRUD | Calls `refreshUsers`. |

| `onCategoryChange()` | `App` → CategoryManager | After category CRUD | Calls `refreshCategories`. |

| `onCategoryClick(data)` | Dashboard → CategoryChart | Click on category bar | Navigates to expense list filtered by that category. |

| `onUserClick(data)` | Dashboard → UserChart | Click on user bar | Navigates to expense list filtered by that user. |

| `onClose()` | Modals / CalendarPicker | Modal close or overlay click | Clears selected item / closes modal. |



## API Layer (`src/services/api.js`)



All calls use `api.post('/budget', payload)`.



Base URL:


const API_BASE_URL = 'https://ud407d2kwj.execute-api.ap-south-2.amazonaws.com/prod';




The `ensureEndOfDay` function appends ` 23:59:59` to a plain `YYYY‑MM‑DD` date so that end dates are inclusive of the entire day.



### Expense Functions



| Function | `action` | Payload fields |

|----------|----------|----------------|

| `getExpenses()` | `"get_expenses"` | – |

| `getExpensesByDateRange(startDate, endDate)` | `"get_expenses_by_date_range"` | `startDate`, `endDate` (normalized to end‑of‑day) |

| `getExpensesByMonth(year, month)` | `"get_expenses_by_month"` | `year`, `month` |

| `addExpense(userId, categoryId, amount, description)` | `"add_expense"` | `UserId`, `CategoryId`, `Amount`, `Description` |

| `updateExpense(expenseId, userId, categoryId, amount, description)` | `"update_expense"` | `ExpenseId`, `UserId`, `CategoryId`, `Amount`, `Description` |

| `deleteExpense(expenseId)` | `"delete_expense"` | `ExpenseId` |

| `getExpensesByCategory(startDate, endDate)` | `"get_expenses_by_category"` | `startDate`, `endDate` (normalized) |

| `getExpensesByUser(startDate, endDate)` | `"get_expenses_by_user"` | `startDate`, `endDate` (normalized) |



### User Functions



| Function | `action` | Payload fields |

|----------|----------|----------------|

| `getUsers()` | `"get_users"` | – |

| `addUser(name, description)` | `"add_user"` | `Name`, `Description` |

| `updateUser(userId, name, description)` | `"update_user"` | `UserId`, `Name`, `Description` |

| `deleteUser(userId)` | `"delete_user"` | `UserId` |



### Category Functions



| Function | `action` | Payload fields |

|----------|----------|----------------|

| `getCategories()` | `"get_categories"` | – |

| `addCategory(categoryName, description)` | `"add_category"` | `CategoryName`, `Description` |

| `updateCategory(categoryId, categoryName, description)` | `"update_category"` | `CategoryId`, `CategoryName`, `Description` |

| `deleteCategory(categoryId)` | `"delete_category"` | `CategoryId` |



### Infrastructure / Test Functions



| Function | `action` | Payload fields |

|----------|----------|----------------|

| `testAPI()` | `"query"` | – |

| `stopInfraAPI()` | `"stop"` | – |



## Backend Lambda (`lambda/lambda_function.py`)



### Infrastructure Manager



The `InfrastructureManager` class wraps an EC2 instance and handles:



- `get_instance_status()` – returns `(state, public_ip)`.

- `wait_for_stop()` – polls until the instance stops (max 5 minutes).

- `start_instance()` – starts the instance and waits until running.

- `wait_for_database_smart(public_ip)` – attempts a PyMySQL connection, logging only if the database is not immediately reachable.

- `cold_start_infrastructure()` – ensures the instance is running and the database is reachable.

- `log_access(action)` – sends a shell command to append a log line to `/var/log/infra_access.log` on the EC2 instance.



### Lambda Handler



The `lambda_handler` reads `action` from the JSON body. For actions:



- `start`, `stop`, `status` – direct EC2 management, no DB connection.

- `query` – runs `SELECT * FROM Expenses ORDER BY Timestamp DESC`.

- All other actions first call `cold_start_infrastructure()` to ensure the DB is reachable, then connect with PyMySQL and execute the appropriate SQL.



Database configuration is loaded from SSM:


db_password = get_parameter('/budgetApp/ec2/mariadb/password')

DB_CONFIG = {


'user': 'budget_user',

'password': db_password,

'database': 'budget',

'port': 3306


}




The Lambda returns CORS headers with `Access-Control-Allow-Origin: *`.



### Database Tables (inferred from SQL)



| Table | Columns |

|-------|---------|

| `Expenses` | `ExpenseId`, `UserId`, `CategoryId`, `Amount`, `Description`, `Timestamp` (implied) |

| `Users` | `UserId`, `Name`, `Description` |

| `Categories` | `CategoryId`, `CategoryName`, `Description` |



### Known Inconsistencies in Fallback Data



- `useBaseData` fallback uses `user_id`, `category_id`, `name`, `description`, `category_name` (snake_case).

- `useExpenses` fallback uses `expense_id`, `amount`, `category_name`, `description`, `expense_date`, `user_name`.



These fallback data structures do not match the fields expected by the React components (which use PascalCase like `UserId`, `CategoryId`, `Amount`, `Timestamp`). They are only used for offline/error scenarios.



## Component Details



### Dashboard (`src/components/Dashboard/Dashboard.js`)



- Receives: `dateRange`, `filteredExpenses`, `users`, `categories`, `loading`, `apiStatus`, `onRefresh`, `onNavigate`.

- Computes derived data via `useMemo`:

  - `totalExpenses` – sum of `Amount`.

  - `categoryBreakdown` – `[{ name, value, categoryId }]` sorted descending.

  - `userBreakdown` – `[{ name, total, userId }]` sorted descending.

  - `userCategoryBreakdown` – for stacked bars, keyed by user name and category name.

  - `categoryNames` – sorted ascending by total (so largest category appears at top of stacked bars).

  - `recentExpensesData` – latest 10 expenses in the date range.

  - `dailyExpenseData` – an array of day objects with cumulative totals and per‑category cumulative totals.

- Renders:

  - Three `StatCard`s (total expenses, categories, users).

  - Four charts: `CategoryChart`, `UserChart`, `UserCategoryChart`, `DayWiseChart`.

  - A “Recent Expenses” list.

- Chart clicks call `onNavigate('expenses', { type: 'category'|'user', value })`.



### ExpenseList (`src/components/Expenses/ExpenseList.js`)



- Receives `filteredExpenses`, `users`, `categories`, `dateRange`, `loading`, `onRefresh`, `initialFilter`.

- Applies client‑side search, category/user filter, sorting, and pagination on top of the already date‑filtered list.

- Editing/deleting uses the shared `expenseAPI` and calls `onRefresh` after success.



### AddExpense (`src/components/Expenses/AddExpense.js`)



- Simple form with user select, category select, amount input, and description textarea.

- Calls `expenseAPI.addExpense` and triggers `onExpenseAdded()`.



### UserManager / CategoryManager



- Provide CRUD with confirmation dialogs.

- After successful ops, call both `onRefresh()` and the respective change callback (`onUserChange` / `onCategoryChange`).



## Utility Modules



| Module | Export(s) | Purpose |

|--------|-----------|---------|

| `src/utils/dateHelpers.js` | `dateHelpers.getCurrentMonth()`, `.getPreviousMonth()`, `.formatDate()`, `.formatDateForAPI()`, `.getMonthName()` | Date‑range helpers for the calendar and API calls. |

| `src/utils/dataHelpers.js` | `getUserName(userId, users)`, `getCategoryName(categoryId, categories)` | Map IDs to display names. |

| `src/utils/chartColors.js` | `COLORS`, `CATEGORY_COLOR_MAP`, `getCategoryColor(name, idx)` | Fixed color assignments for chart categories. |



## Build & Run



- `npm start` – run the React development server.

- `npm run build` – create a production build.

- `npm test` – run tests.

- `npm run eject` – eject from react‑scripts (not recommended).



## Summary



- The app is a classic “single API endpoint + action” architecture.

- The Lambda cold‑starts the EC2 database on demand, so the first request after an idle period may take longer.

- Frontend state is split between App‑level state, custom hooks, and component‑local state.

- All API calls are centralized in `src/services/api.js`.

- Client‑side dashboard calculations are done entirely in React with `useMemo`.

- The entire codebase uses PascalCase for backend/DB column names, except for hard‑coded fallback data that uses snake_case (a known limitation).