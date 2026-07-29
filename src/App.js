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

    // Navigation callback – used by Dashboard to switch pages
    const handleNavigate = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    // Compute filtered expenses based on date range
    const filteredExpenses = useMemo(() => {
        if (!dateRange) return expenses;
        return expenses.filter(expense =>
            expense.Timestamp &&
            expense.Timestamp >= dateRange.startDate &&
            expense.Timestamp <= dateRange.endDate
        );
    }, [expenses, dateRange]);

    // Fetch only users, categories, and expenses for the selected date range
    const loadAllData = useCallback(async () => {
        setLoading(true);
        setApiStatus('connecting');

        try {
            console.log('🔄 Loading data...');

            // Fetch users, categories, and expenses in parallel
            const [usersRes, categoriesRes, expensesRes] = await Promise.all([
                userAPI.getUsers(),
                categoryAPI.getCategories(),
                expenseAPI.getExpensesByDateRange(dateRange.startDate, dateRange.endDate)
            ]);

            console.log('👥 Users Response:', usersRes.data);
            console.log('🏷️ Categories Response:', categoriesRes.data);
            console.log('📊 Expenses Response:', expensesRes.data);

            setUsers(usersRes.data.users || []);
            setCategories(categoriesRes.data.categories || []);
            setExpenses(expensesRes.data.expenses || []);

            setApiStatus('connected');
            console.log('✅ All data loaded successfully!');

        } catch (error) {
            console.error('❌ API Error:', error);
            setApiStatus('error');

            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to load data. Using sample data instead.';
            alert(msg);

            // Set sample data for testing UI
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

            setUsers([
                { user_id: '1', name: 'John Doe', description: 'Primary user' },
                { user_id: '2', name: 'Jane Smith', description: 'Secondary user' }
            ]);

            setCategories([
                { category_id: '1', category_name: 'Food', description: 'Food and groceries' },
                { category_id: '2', category_name: 'Transport', description: 'Transportation costs' }
            ]);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    // Load all data on mount and whenever dateRange changes
    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

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
                    onRefresh={loadAllData}
                    onNavigate={handleNavigate}
                />;
            case 'expenses':
                return <ExpenseList
                    filteredExpenses={filteredExpenses}
                    users={users}
                    categories={categories}
                    dateRange={dateRange}
                    loading={loading}
                    onRefresh={loadAllData}
                />;
            case 'add-expense':
                return <AddExpense users={users} categories={categories} onExpenseAdded={loadAllData} />;
            case 'users':
                return <UserManager users={users} loading={loading} onRefresh={loadAllData} />;
            case 'categories':
                return <CategoryManager categories={categories} loading={loading} onRefresh={loadAllData} />;
            default:
                return <Dashboard
                    dateRange={dateRange}
                    filteredExpenses={filteredExpenses}
                    users={users}
                    categories={categories}
                    loading={loading}
                    apiStatus={apiStatus}
                    onRefresh={loadAllData}
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
                            <button onClick={() => setCurrentPage('dashboard')}>📊 Dashboard</button>
                        </li>
                        <li className={currentPage === 'expenses' ? 'active' : ''}>
                            <button onClick={() => setCurrentPage('expenses')}>📋 Expenses ({filteredExpenses.length})</button>
                        </li>
                        <li className={currentPage === 'add-expense' ? 'active' : ''}>
                            <button onClick={() => setCurrentPage('add-expense')}>➕ Add Expense</button>
                        </li>
                        <li className={currentPage === 'users' ? 'active' : ''}>
                            <button onClick={() => setCurrentPage('users')}>👥 Users ({users.length})</button>
                        </li>
                        <li className={currentPage === 'categories' ? 'active' : ''}>
                            <button onClick={() => setCurrentPage('categories')}>🏷️ Categories ({categories.length})</button>
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
