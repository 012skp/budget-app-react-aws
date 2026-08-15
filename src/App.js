import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './App.css';
import { stopInfraAPI, getLastBackup } from './services/api';
import { dateHelpers } from './utils/dateHelpers';
import CalendarPicker from './components/Common/CalendarPicker';

import Dashboard from './components/Dashboard/Dashboard';
import ExpenseList from './components/Expenses/ExpenseList';
import AddExpense from './components/Expenses/AddExpense'
import UserManager from './components/Users/UserManager'
import CategoryManager from './components/Categories/CategoryManager'
import { useBaseData } from './hooks/useBaseData';
import { useExpenses } from './hooks/useExpenses';

const formatBackupTime = (value) => {
  if (!value) return 'N/A';
  const normalized = String(value).includes('T') ? value : String(value).replace(' ', 'T');
  const parsed = new Date(normalized);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return String(value);
};

const isBackupOlderThanADay = (value) => {
  if (!value) return false;
  const normalized = String(value).includes('T') ? value : String(value).replace(' ', 'T');
  const parsed = new Date(normalized);
  if (isNaN(parsed.getTime())) return false;
  return Date.now() - parsed.getTime() > 24 * 60 * 60 * 1000;
};

function App() {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [dateRange, setDateRange] = useState(() => {
        const current = dateHelpers.getCurrentMonth();
        return { startDate: current.start, endDate: current.end };
    });
    const [stoppingInfra, setStoppingInfra] = useState(false);
    const [expenseFilter, setExpenseFilter] = useState(null);
    const [lastBackup, setLastBackup] = useState(null);
    const [backupLoadError, setBackupLoadError] = useState(false);

    const { users, categories, refreshUsers, refreshCategories } = useBaseData();
    const { expenses, loading, apiStatus, fetchExpenses } = useExpenses(dateRange);

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

    // Load expenses whenever date range changes (including on mount)
    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    // Load last database backup information once when the app mounts
    useEffect(() => {
        let cancelled = false;
        getLastBackup()
            .then(response => {
                if (cancelled) return;
                const data = response.data || {};
                const backup = data.last_backup || data.lastBackup || data.backup_time || data.Timestamp || data.timestamp || data.message;
                if (backup) {
                    setLastBackup(backup);
                    setBackupLoadError(false);
                } else {
                    setLastBackup(null);
                    setBackupLoadError(true);
                }
            })
            .catch(() => {
                if (cancelled) return;
                setLastBackup(null);
                setBackupLoadError(true);
            });
        return () => {
            cancelled = true;
        };
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
                <div className="backup-status">
                    {lastBackup ? (
                        <span className={`status-indicator ${isBackupOlderThanADay(lastBackup) ? 'backup-stale' : 'backup-ok'}`}>
                            🗄️ Last backup: {formatBackupTime(lastBackup)}
                        </span>
                    ) : (
                        <span className="status-indicator">
                            🗄️ Last backup: {backupLoadError ? 'Unavailable' : 'Loading...'}
                        </span>
                    )}
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
