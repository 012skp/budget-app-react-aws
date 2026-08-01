import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import { expenseAPI, userAPI, categoryAPI, stopInfraAPI } from './services/api';
import { dateHelpers } from './utils/dateHelpers';
import CalendarPicker from './components/Common/CalendarPicker';

import Dashboard from './components/Dashboard/Dashboard';
import ExpenseList from './components/Expenses/ExpenseList';
import AddExpense from './components/Expenses/AddExpense'
import UserManager from './components/Users/UserManager'
import CategoryManager from './components/Categories/CategoryManager'

function App() {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [dateRange, setDateRange] = useState(() => {
        const current = dateHelpers.getCurrentMonth();
        return { startDate: current.start, endDate: current.end };
    });
    const [expenses, setExpenses] = useState([]);
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiStatus, setApiStatus] = useState('connecting');
    const [stoppingInfra, setStoppingInfra] = useState(false);
    const [expenseFilter, setExpenseFilter] = useState(null);

    // Navigation callback – used by Dashboard to switch pages
    const handleNavigate = useCallback((page, filter) => {
        setCurrentPage(page);
        setExpenseFilter(filter || null);
    }, []);

    // Compute filtered expenses based on date range.
    // We compare only the YYYY-MM-DD part so the whole endDate day is included.
    const filteredExpenses = useMemo(() => {
        if (!dateRange) return expenses;
        return expenses.filter(expense => {
            if (!expense.Timestamp) return false;
            const expenseDate = expense.Timestamp.slice(0, 10);
            return expenseDate >= dateRange.startDate && expenseDate <= dateRange.endDate;
        });
    }, [expenses, dateRange]);

    // Fetch users & categories – only once on mount
    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                const [usersRes, categoriesRes] = await Promise.all([
                    userAPI.getUsers(),
                    categoryAPI.getCategories()
                ]);

                setUsers(usersRes.data.users || []);
                setCategories(categoriesRes.data.categories || []);

                console.log('👥 Users loaded');
                console.log('🏷️ Categories loaded');
            } catch (error) {
                console.error('❌ Base data fetch error:', error);

                // Fallback demo data for users/categories
                setUsers([
                    { user_id: '1', name: 'John Doe', description: 'Primary user' },
                    { user_id: '2', name: 'Jane Smith', description: 'Secondary user' }
                ]);

                setCategories([
                    { category_id: '1', category_name: 'Food', description: 'Food and groceries' },
                    { category_id: '2', category_name: 'Transport', description: 'Transportation costs' }
                ]);
            }
        };

        fetchBaseData();
    }, []);

    // Fetch expenses for the currently selected date range
    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        setApiStatus('connecting');

        try {
            console.log(`🔄 Loading expenses for ${dateRange.startDate} to ${dateRange.endDate}...`);

            const expensesRes = await expenseAPI.getExpensesByDateRange(
                dateRange.startDate,
                dateRange.endDate
            );

            setExpenses(expensesRes.data.expenses || []);

            setApiStatus('connected');
            console.log('✅ Expenses loaded successfully!');
        } catch (error) {
            console.error('❌ API Error:', error);
            setApiStatus('error');

            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to load expenses. Using sample data instead.';
            alert(msg);

            // Fallback sample expenses
            setExpenses([
                {
                    expense_id: '1',
                    amount: 1250.00,
                    category_name: 'Food',
                    description: 'Grocery shopping',
                    expense_date: '2024-06-15',
                    user_name: 'John Doe'
                },
                {
                    expense_id: '2',
                    amount: 850.00,
                    category_name: 'Transport',
                    description: 'Uber rides',
                    expense_date: '2024-06-14',
                    user_name: 'Jane Smith'
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    // Refresh categories from the API so the UI cache stays in sync
    const refreshCategories = useCallback(async () => {
        try {
            const res = await categoryAPI.getCategories();
            setCategories(res.data.categories || []);
            console.log('🏷️ Categories refreshed');
        } catch (error) {
            console.error('❌ Failed to refresh categories:', error);
        }
    }, []);

    // Refresh users from the API so the UI cache stays in sync
    const refreshUsers = useCallback(async () => {
        try {
            const res = await userAPI.getUsers();
            setUsers(res.data.users || []);
            console.log('👥 Users refreshed');
        } catch (error) {
            console.error('❌ Failed to refresh users:', error);
        }
    }, []);

    // Load expenses whenever date range changes (including on mount)
    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleStopInfra = async () => {
        const confirmed = window.confirm(
            "This will stop your AWS infrastructure. Continue?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setStoppingInfra(true);
            const response = await stopInfraAPI();
            alert(
                response.data.message ||
                "Infrastructure stop request submitted."
            );
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to stop infrastructure.';
            alert(msg);
        } finally {
            setStoppingInfra(false);
        }
    };

    const renderPage = () => {
        switch(currentPage) {
            case 'dashboard':
                return <Dashboard
                    dateRange={dateRange}
                    filteredExpenses={filteredExpenses}
                    users={users}
                    categories={categories}
                    loading={loading}
                    apiStatus={apiStatus}
                    onRefresh={fetchExpenses}
                    onNavigate={handleNavigate}
                />;
            case 'expenses':
                return <ExpenseList
                    key={expenseFilter ? `${expenseFilter.type}-${expenseFilter.value}` : 'all'}
                    filteredExpenses={filteredExpenses}
                    users={users}
                    categories={categories}
                    dateRange={dateRange}
                    loading={loading}
                    onRefresh={fetchExpenses}
                    initialFilter={expenseFilter}
                />;
            case 'add-expense':
                return <AddExpense users={users} categories={categories} onExpenseAdded={fetchExpenses} />;
            case 'users':
                return <UserManager users={users} loading={loading} onRefresh={fetchExpenses} onUserChange={refreshUsers} />;
            case 'categories':
                return <CategoryManager categories={categories} loading={loading} onRefresh={fetchExpenses} onCategoryChange={refreshCategories} />;
            default:
                return <Dashboard
                    dateRange={dateRange}
                    filteredExpenses={filteredExpenses}
                    users={users}
                    categories={categories}
                    loading={loading}
                    apiStatus={apiStatus}
                    onRefresh={fetchExpenses}
                    onNavigate={handleNavigate}
                />;
        }
    };

    const handleDateChange = (newRange) => {
        setDateRange(newRange);
    };

    return (
        <div className="app">
            <style>{`
                @media (max-width: 768px) {
                    .app-body {
                        display: flex;
                        flex-direction: column;
                    }
                    .sidebar {
                        order: -1;
                    }
                }
            `}</style>
            <header className="app-header">
                <h1>💰 Budget Tracker</h1>
                <div className="calendar-bar">
                    <CalendarPicker dateRange={dateRange} onDateChange={handleDateChange} />
                </div>
                <div className="api-status">

    <span className={`status-indicator ${apiStatus}`}>
        {apiStatus === 'connecting' && '🔄 Connecting to AWS...'}
        {apiStatus === 'connected' && '✅ AWS Connected'}
        {apiStatus === 'error' && '❌ Connection Error'}
    </span>


                    {apiStatus === 'connected' && (
                        <button
                            className="stop-infra-btn"
                            onClick={handleStopInfra}
                            disabled={stoppingInfra}
                        >
                            {stoppingInfra
                                ? '⏳ Stopping...'
                                : '🛑 Stop AWS Infra'}
                        </button>
                    )}
                    

                </div>
            </header>

            <div className="app-body">
                <nav className="sidebar">
                    <ul>
                        <li className={currentPage === 'dashboard' ? 'active' : ''}>
                            <button onClick={() => handleNavigate('dashboard')}>📊 Dashboard</button>
                        </li>
                        <li className={currentPage === 'expenses' ? 'active' : ''}>
                            <button onClick={() => handleNavigate('expenses')}>📋 Expenses ({filteredExpenses.length})</button>
                        </li>
                        <li className={currentPage === 'add-expense' ? 'active' : ''}>
                            <button onClick={() => handleNavigate('add-expense')}>➕ Add Expense</button>
                        </li>
                        <li className={currentPage === 'users' ? 'active' : ''}>
                            <button onClick={() => handleNavigate('users')}>👥 Users ({users.length})</button>
                        </li>
                        <li className={currentPage === 'categories' ? 'active' : ''}>
                            <button onClick={() => handleNavigate('categories')}>🏷️ Categories ({categories.length})</button>
                        </li>
                    </ul>
                </nav>

                <main className="main-content">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}

export default App;
