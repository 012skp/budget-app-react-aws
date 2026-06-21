import axios from 'axios';

const API_BASE_URL = 'https://ud407d2kwj.execute-api.ap-south-2.amazonaws.com/prod';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Base API call function
const callAPI = (payload) => api.post('/budget', payload);

// Expenses API calls
export const expenseAPI = {
    // Get all expenses
    getExpenses: () => callAPI({
        action: "get_expenses"
    }),

    // Get expenses by date range
    getExpensesByDateRange: (startDate, endDate) => callAPI({
        action: "get_expenses_by_date_range",
        startDate,
        endDate
    }),

    // Get expenses by month
    getExpensesByMonth: (year, month) => callAPI({
        action: "get_expenses_by_month",
        year,
        month
    }),

    // Add new expense - FIXED: Use table column names
    addExpense: (userId, categoryId, amount, description) => callAPI({
        action: "add_expense",
        UserId: userId,        // ✅ Changed from userId to UserId
        CategoryId: categoryId, // ✅ Changed from categoryId to CategoryId
        Amount: amount,        // ✅ Changed from amount to Amount
        Description: description // ✅ Changed from description to Description
    }),

    // Update expense - FIXED: Use table column names
    updateExpense: (expenseId, userId, categoryId, amount, description) => callAPI({
        action: "update_expense",
        ExpenseId: expenseId,   // ✅ Changed from expenseId to ExpenseId
        UserId: userId,         // ✅ Changed from userId to UserId
        CategoryId: categoryId, // ✅ Changed from categoryId to CategoryId
        Amount: amount,         // ✅ Changed from amount to Amount
        Description: description // ✅ Changed from description to Description
    }),

    // Delete expense - FIXED: Use table column names
    deleteExpense: (expenseId) => callAPI({
        action: "delete_expense",
        ExpenseId: expenseId    // ✅ Changed from expenseId to ExpenseId
    }),

    // Get expense breakdown by category
    getExpensesByCategory: (startDate, endDate) => callAPI({
        action: "get_expenses_by_category",
        startDate,
        endDate
    }),

    // Get expense breakdown by user
    getExpensesByUser: (startDate, endDate) => callAPI({
        action: "get_expenses_by_user",
        startDate,
        endDate
    }),
};

// Users API calls - FIXED: Use table column names
export const userAPI = {
    getUsers: () => callAPI({
        action: "get_users"
    }),

    addUser: (name, description) => callAPI({
        action: "add_user",
        Name: name,             // ✅ Changed from name to Name
        Description: description // ✅ Changed from description to Description
    }),

    updateUser: (userId, name, description) => callAPI({
        action: "update_user",
        UserId: userId,         // ✅ Changed from userId to UserId
        Name: name,             // ✅ Changed from name to Name
        Description: description // ✅ Changed from description to Description
    }),

    deleteUser: (userId) => callAPI({
        action: "delete_user",
        UserId: userId          // ✅ Changed from userId to UserId
    }),
};

// Categories API calls - FIXED: Use table column names
export const categoryAPI = {
    getCategories: () => callAPI({
        action: "get_categories"
    }),

    addCategory: (categoryName, description) => callAPI({
        action: "add_category",
        CategoryName: categoryName, // ✅ Changed from categoryName to CategoryName
        Description: description    // ✅ Changed from description to Description
    }),

    updateCategory: (categoryId, categoryName, description) => callAPI({
        action: "update_category",
        CategoryId: categoryId,     // ✅ Changed from categoryId to CategoryId
        CategoryName: categoryName, // ✅ Changed from categoryName to CategoryName
        Description: description    // ✅ Changed from description to Description
    }),

    deleteCategory: (categoryId) => callAPI({
        action: "delete_category",
        CategoryId: categoryId      // ✅ Changed from categoryId to CategoryId
    }),
};

// Test API connection
export const testAPI = () => callAPI({
    action: "query"
});

// API to stop Infra(EC2,Database)
export const stopInfraAPI = () => callAPI({
    action: "stop"
});


export default api;
