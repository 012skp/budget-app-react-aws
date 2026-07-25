import React, { useState, useEffect } from 'react';
import './App.css';
import { expenseAPI, userAPI, categoryAPI, testAPI, stopInfraAPI } from './services/api';
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

    // Load all data on component mount
    useEffect(() => {
        loadAllData();
    }, []);



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

            alert(
                error.response?.data?.message ||
                "Failed to stop infrastructure."
            );
        } finally {
            setStoppingInfra(false);
        }
    };

    const loadAllData = async () => {
        setLoading(true);
        setApiStatus('connecting');

        try {
            console.log('🔄 Testing API connection...');

            // Test API connection first
            const testResponse = await testAPI();
            console.log('✅ API Test Response:', testResponse.data);

            // Load all data in parallel
            const [expensesRes, usersRes, categoriesRes] = await Promise.all([
                expenseAPI.getExpenses(),
                userAPI.getUsers(),
                categoryAPI.getCategories()
            ]);

            console.log('📊 Expenses Response:', expensesRes.data);
            console.log('👥 Users Response:', usersRes.data);
            console.log('🏷️ Categories Response:', categoriesRes.data);

            // Set data from API responses
            setExpenses(expensesRes.data.expenses || []);
            setUsers(usersRes.data.users || []);
            setCategories(categoriesRes.data.categories || []);

            setApiStatus('connected');
            console.log('✅ All data loaded successfully!');

        } catch (error) {
            console.error('❌ API Error:', error);
            setApiStatus('error');

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
    };


    const renderPage = () => {
        switch(currentPage) {
            case 'dashboard':
                return <Dashboard
                    dateRange={dateRange}
                    expenses={expenses}
                    users={users}
                    categories={categories}
                    loading={loading}
                    apiStatus={apiStatus}
                    onRefresh={loadAllData}
                />;
            case 'expenses':
                return <ExpenseList expenses={expenses} users={users} categories={categories} loading={loading} onRefresh={loadAllData} />;
            case 'add-expense':
                return <AddExpense users={users} categories={categories} onExpenseAdded={loadAllData} />;
            case 'users':
                return <UserManager users={users} loading={loading} onRefresh={loadAllData} />;
            case 'categories':
                return <CategoryManager categories={categories} loading={loading} onRefresh={loadAllData} />;
            default:
                return <Dashboard
                    dateRange={dateRange}
                    expenses={expenses}
                    users={users}
                    categories={categories}
                    loading={loading}
                    apiStatus={apiStatus}
                    onRefresh={loadAllData}
                />;
        }
    };

    const handleDateChange = (newRange) => {
        setDateRange(newRange);
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>💰 Budget Tracker</h1>
                <div className="calendar-bar">
                    <CalendarPicker dateRange={dateRange} onDateChange={handleDateChange} />
                </div>
                <div className="api-status">

    <span className={`status-indicator ${apiStatus}`}>
        {apiStatus === 'connecting' && '🔄 Connecting to AWS...'}
        {apiStatus === 'connected' && '✅ AWS Connected'}
        {apiStatus === 'error' && '❌ Using Sample Data'}
    </span>


                    {apiStatus === 'connected' && (
                        <button
                            className="stop-infra-btn"
                            onClick={handleStopInfra}
                            disabled={stoppingInfra}
                        >
                            {stoppingInfra
                                ? '⏳ Stopping...'
                                : '🛑 Stop Infra'}
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
                            <button onClick={() => setCurrentPage('expenses')}>📋 Expenses ({expenses.length})</button>
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
