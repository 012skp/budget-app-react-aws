import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";

import { expenseAPI } from '../../services/api';
import React, {useEffect, useState, useMemo} from 'react';


import {getUserName, getCategoryName} from '../../utils/dataHelpers';

function Dashboard({
                       dateRange,
                       filteredExpenses,
                       expenses,
                       users,
                       categories,
                       loading,
                       onRefresh
                   }) {

    const [categoryBreakdown, setCategoryBreakdown] = useState([]);
    const [userBreakdown, setUserBreakdown] = useState([]);

    const { startDate, endDate } = dateRange;

    // Total of all expenses (no date filter)
    const totalExpenses = useMemo(() =>
        expenses.reduce(
            (sum, expense) => sum + parseFloat(expense.Amount || 0),
            0
        ),
        [expenses]
    );

    // Total of filtered expenses (date range)
    const monthlyExpenses = useMemo(() =>
        filteredExpenses.reduce(
            (sum, expense) => sum + parseFloat(expense.Amount || 0),
            0
        ),
        [filteredExpenses]
    );

    const loadDashboardData = async () => {
        try {
            const [categoryRes, userRes] = await Promise.all([
                expenseAPI.getExpensesByCategory(startDate, endDate),
                expenseAPI.getExpensesByUser(startDate, endDate)
            ]);

            setCategoryBreakdown(
                (categoryRes.data.breakdown || []).map(item => ({
                    name: item.CategoryName,
                    value: parseFloat(item.TotalAmount),
                    count: item.ExpenseCount
                }))
            );

            setUserBreakdown(
                (userRes.data.breakdown || []).map(item => ({
                    name: item.Name,
                    total: parseFloat(item.TotalAmount),
                    count: item.ExpenseCount
                }))
            );
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to load dashboard data.';
            alert(msg);
        }
    }

    useEffect(() => {
        loadDashboardData();
    }, [startDate, endDate]);



    const COLORS = [
        "#0088FE",
        "#00C49F",
        "#FFBB28",
        "#FF8042",
        "#8884D8",
        "#82CA9D"
    ];



    const handleRefresh = async () => {
        await onRefresh();
        await loadDashboardData();
    };



    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>📊 Dashboard</h2>

                <div className="dashboard-controls">
                    <button
                        className="refresh-btn"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        🔄 Refresh Data
                    </button>
                </div>
            </div>

            <div className="stats-cards">
                <div className="stat-card">
                    <h3>Total Expenses</h3>
                    <p className="amount">
                        ₹{totalExpenses.toLocaleString('en-IN', {
                        minimumFractionDigits: 2
                    })}
                    </p>
                    <small>{expenses.length} transactions</small>
                </div>

                <div className="stat-card">
                    <h3>Selected Range ({startDate} to {endDate})</h3>
                    <p className="amount">
                        ₹{monthlyExpenses.toLocaleString('en-IN', {
                        minimumFractionDigits: 2
                    })}
                    </p>
                    <small>{filteredExpenses.length} transactions</small>
                </div>

                <div className="stat-card">
                    <h3>Categories</h3>
                    <p className="count">{categories.length}</p>
                    <small>Active categories</small>
                </div>

                <div className="stat-card">
                    <h3>Users</h3>
                    <p className="count">{users.length}</p>
                    <small>Active users</small>
                </div>
            </div>
            <div className="dashboard-charts">

                <div className="chart-card">
                    <div className="chart-container">
                        <h3>Expenses By Category</h3>

                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryBreakdown}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {categoryBreakdown.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>

                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-container">
                        <h3>Expenses By User</h3>

                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={userBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />

                                <Bar dataKey="total" name="Amount">
                                    {userBreakdown.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            <div className="recent-expenses">
                <h3>Recent Expenses ({startDate} to {endDate})</h3>

                {loading ? (
                    <p>🔄 Loading expenses from AWS...</p>
                ) : filteredExpenses.length > 0 ? (
                    <div className="expense-list">
                        {filteredExpenses.slice(0, 5).map(expense => (
                            <div
                                key={expense.ExpenseId}
                                className="expense-item"
                            >
                                <div className="expense-info">
                                    <span className="expense-id">#{expense.ExpenseId}</span>
                                    <span className="expense-description">
                                        {expense.Description}
                                    </span>

                                    <span className="expense-category">
                                        {getCategoryName(
                                            expense.CategoryId,
                                            categories
                                        )}
                                    </span>
                                </div>

                                <div className="expense-details">
                                    <span className="expense-amount">
                                        ₹{parseFloat(
                                        expense.Amount
                                    ).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2
                                    })}
                                    </span>

                                    <span className="expense-date">
                                        {expense.Timestamp}
                                    </span>

                                    <span className="expense-user">
                                        {getUserName(
                                            expense.UserId,
                                            users
                                        )}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No expenses found for {startDate} to {endDate}</p>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
