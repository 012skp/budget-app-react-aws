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

import React, {useMemo} from 'react';

import {getUserName, getCategoryName} from '../../utils/dataHelpers';

function Dashboard({
                       dateRange,
                       filteredExpenses,
                       users,
                       categories,
                       loading,
                       apiStatus,
                       onRefresh,
                       onNavigate
                   }) {

    const { startDate, endDate } = dateRange;

    // Total of filtered expenses (date range)
    const totalExpenses = useMemo(() =>
        filteredExpenses.reduce(
            (sum, expense) => sum + parseFloat(expense.Amount || 0),
            0
        ),
        [filteredExpenses]
    );

    // Compute category breakdown client-side
    const categoryBreakdown = useMemo(() => {
        const map = {};
        filteredExpenses.forEach(exp => {
            const catId = exp.CategoryId;
            const catName = getCategoryName(catId, categories);
            const amount = parseFloat(exp.Amount) || 0;
            map[catName] = (map[catName] || 0) + amount;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [filteredExpenses, categories]);

    // Compute user breakdown client-side
    const userBreakdown = useMemo(() => {
        const map = {};
        filteredExpenses.forEach(exp => {
            const userId = exp.UserId;
            const userName = getUserName(userId, users);
            const amount = parseFloat(exp.Amount) || 0;
            map[userName] = (map[userName] || 0) + amount;
        });
        return Object.entries(map).map(([name, total]) => ({ name, total }));
    }, [filteredExpenses, users]);

    // Compute user‑category breakdown for stacked bar chart
    const userCategoryBreakdown = useMemo(() => {
        const catNames = categories.reduce((acc, cat) => {
            acc[cat.CategoryId] = cat.CategoryName;
            return acc;
        }, {});
        const userNames = users.reduce((acc, u) => {
            acc[u.UserId] = u.Name;
            return acc;
        }, {});
        const map = {};
        filteredExpenses.forEach(exp => {
            const userId = exp.UserId;
            const catId = exp.CategoryId;
            const userName = userNames[userId] || `User ${userId}`;
            const catName = catNames[catId] || `Category ${catId}`;
            if (!map[userId]) {
                map[userId] = { name: userName };
            }
            const amount = parseFloat(exp.Amount) || 0;
            map[userId][catName] = (map[userId][catName] || 0) + amount;
        });
        return Object.values(map);
    }, [filteredExpenses, users, categories]);

    const categoryNames = useMemo(() => {
        const set = new Set();
        filteredExpenses.forEach(exp => {
            const cat = categories.find(c => c.CategoryId === exp.CategoryId);
            if (cat) set.add(cat.CategoryName);
        });
        return Array.from(set);
    }, [filteredExpenses, categories]);

    const COLORS = [
        "#0088FE",
        "#00C49F",
        "#FFBB28",
        "#FF8042",
        "#8884D8",
        "#82CA9D"
    ];

    const handleRefresh = async () => {
        if (onRefresh) await onRefresh();
    };

    // dynamic width for the bar chart (based on number of user entries)
    const barChartWidth = useMemo(
        () => Math.max(300, userCategoryBreakdown.length * 120),
        [userCategoryBreakdown]
    );

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
                {/* Clickable Expenses card */}
                <button
                    className="stat-card"
                    type="button"
                    onClick={() => onNavigate && onNavigate('expenses')}
                >
                    <h3>Total Expenses</h3>
                    <p className="amount">
                        ₹{totalExpenses.toLocaleString('en-IN', {
                        minimumFractionDigits: 2
                    })}
                    </p>
                    <small>{filteredExpenses.length} transactions</small>
                </button>

                {/* Clickable Categories card */}
                <button
                    className="stat-card"
                    type="button"
                    onClick={() => onNavigate && onNavigate('categories')}
                >
                    <h3>Categories</h3>
                    <p className="count">{categories.length}</p>
                    <small>Active categories</small>
                </button>

                {/* Clickable Users card */}
                <button
                    className="stat-card"
                    type="button"
                    onClick={() => onNavigate && onNavigate('users')}
                >
                    <h3>Users</h3>
                    <p className="count">{users.length}</p>
                    <small>Active users</small>
                </button>
            </div>
            <div className="dashboard-charts">

                <div className="chart-card">
                    <div className="chart-container">
                        <h3>Expenses Per Category</h3>

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
                        <h3>Expenses Per User</h3>

                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={userBreakdown}
                                    dataKey="total"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {userBreakdown.map((entry, index) => (
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
                        <h3>Expense Per User Per Category</h3>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <BarChart
                                width={barChartWidth}
                                height={300}
                                data={userCategoryBreakdown}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />

                                {categoryNames.map((name, idx) => (
                                    <Bar
                                        key={name}
                                        dataKey={name}
                                        stackId="a"
                                        fill={COLORS[idx % COLORS.length]}
                                    />
                                ))}
                            </BarChart>
                        </div>
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
