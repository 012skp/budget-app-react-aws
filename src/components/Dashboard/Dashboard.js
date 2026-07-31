import React, { useMemo } from 'react';
import {
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LabelList,
    defs,
    linearGradient,
    stop
} from "recharts";

import { getUserName, getCategoryName } from '../../utils/dataHelpers';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div
                style={{
                    backgroundColor: '#fff',
                    padding: '10px 14px',
                    border: '1px solid #edf0f7',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '13px'
                }}
            >
                <p style={{ margin: 0, fontWeight: 600, color: '#333' }}>{label}</p>
                {payload.map((item, idx) => (
                    <p
                        key={idx}
                        style={{
                            margin: '6px 0 0',
                            color: item.color || item.fill || '#333',
                            fontWeight: 500
                        }}
                    >
                        {item.name}: ₹{Number(item.value).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

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
    const totalExpenses = useMemo(
        () =>
            filteredExpenses.reduce(
                (sum, expense) => sum + parseFloat(expense.Amount || 0),
                0
            ),
        [filteredExpenses]
    );

    // Compute category breakdown client-side, sorted descending so highest is left
    const categoryBreakdown = useMemo(() => {
        const map = {};
        filteredExpenses.forEach((exp) => {
            const catId = exp.CategoryId;
            const catName = getCategoryName(catId, categories);
            const amount = parseFloat(exp.Amount) || 0;
            if (!map[catName]) {
                map[catName] = { name: catName, value: 0, categoryId: catId };
            }
            map[catName].value += amount;
        });
        return Object.values(map).sort((a, b) => b.value - a.value);
    }, [filteredExpenses, categories]);

    // Compute user breakdown client-side, sorted descending so highest is left
    const userBreakdown = useMemo(() => {
        const map = {};
        filteredExpenses.forEach((exp) => {
            const userId = exp.UserId;
            const userName = getUserName(userId, users);
            const amount = parseFloat(exp.Amount) || 0;
            if (!map[userName]) {
                map[userName] = { name: userName, total: 0, userId };
            }
            map[userName].total += amount;
        });
        return Object.values(map).sort((a, b) => b.total - a.total);
    }, [filteredExpenses, users]);

    // Compute user‑category breakdown for stacked bar chart, sorted by user total descending
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
        filteredExpenses.forEach((exp) => {
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
        return Object.values(map).sort((a, b) => {
            const sumA = Object.entries(a)
                .filter(([key]) => key !== 'name')
                .reduce((s, [, val]) => s + Number(val || 0), 0);
            const sumB = Object.entries(b)
                .filter(([key]) => key !== 'name')
                .reduce((s, [, val]) => s + Number(val || 0), 0);
            return sumB - sumA;
        });
    }, [filteredExpenses, users, categories]);

    const categoryNames = useMemo(() => {
        const set = new Set();
        filteredExpenses.forEach((exp) => {
            const cat = categories.find((c) => c.CategoryId === exp.CategoryId);
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
        "#82CA9D",
        "#FF6F91",
        "#00C2D1"
    ];

    const handleRefresh = async () => {
        if (onRefresh) await onRefresh();
    };

    const handleCategoryClick = (data) => {
        if (data && data.categoryId != null) {
            onNavigate('expenses', { type: 'category', value: data.categoryId });
        }
    };

    const handleUserClick = (data) => {
        if (data && data.userId != null) {
            onNavigate('expenses', { type: 'user', value: data.userId });
        }
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
                {/* Clickable Expenses card */}
                <button
                    className="stat-card"
                    type="button"
                    onClick={() => onNavigate && onNavigate('expenses')}
                >
                    <h3>Total Expenses</h3>
                    <p className="amount">
                        ₹
                        {totalExpenses.toLocaleString('en-IN', {
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
                {/* Expenses Per Category */}
                <div className="chart-card">
                    <div className="chart-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h3>Expenses Per Category</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={categoryBreakdown} barCategoryGap="15%" margin={{ top: 35, right: 20, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="gradCategory" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F73DF" stopOpacity={0.9} />
                                        <stop offset="95%" stopColor="#4F73DF" stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f0f2f5"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#667', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#667', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 8 }} />
                                <Legend
                                    iconType="circle"
                                    wrapperStyle={{
                                        fontSize: 12,
                                        paddingTop: 10
                                    }}
                                />
                                <Bar
                                    name="Amount"
                                    dataKey="value"
                                    fill="url(#gradCategory)"
                                    radius={[8, 8, 0, 0]}
                                    maxBarSize={40}
                                    onClick={handleCategoryClick}
                                >
                                    <LabelList
                                        dataKey="value"
                                        position="top"
                                        formatter={(value) =>
                                            totalExpenses > 0
                                                ? `${((value / totalExpenses) * 100).toFixed(1)}%`
                                                : '0%'
                                        }
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expenses Per User */}
                <div className="chart-card">
                    <div className="chart-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h3>Expenses Per User</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={userBreakdown} barCategoryGap="15%" margin={{ top: 35, right: 20, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="gradUser" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#12B886" stopOpacity={0.9} />
                                        <stop offset="95%" stopColor="#12B886" stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f0f2f5"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#667', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#667', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 8 }} />
                                <Legend
                                    iconType="circle"
                                    wrapperStyle={{
                                        fontSize: 12,
                                        paddingTop: 10
                                    }}
                                />
                                <Bar
                                    name="Amount"
                                    dataKey="total"
                                    fill="url(#gradUser)"
                                    radius={[8, 8, 0, 0]}
                                    maxBarSize={40}
                                    onClick={handleUserClick}
                                >
                                    <LabelList
                                        dataKey="total"
                                        position="top"
                                        formatter={(value) =>
                                            totalExpenses > 0
                                                ? `${((value / totalExpenses) * 100).toFixed(1)}%`
                                                : '0%'
                                        }
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Per User Per Category – stacked bar */}
                <div className="chart-card">
                    <div className="chart-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h3>Expense Per User Per Category</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart
                                data={userCategoryBreakdown}
                                barCategoryGap="15%"
                                barSize={40}
                                margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
                            >
                                <defs>
                                    {categoryNames.map((name, idx) => (
                                        <linearGradient
                                            key={`gradStack${idx}`}
                                            id={`gradStack${idx}`}
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop offset="5%" stopColor={COLORS[idx]} stopOpacity={0.95} />
                                            <stop offset="95%" stopColor={COLORS[idx]} stopOpacity={0.6} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f0f2f5"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#667', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#667', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 8 }} />
                                <Legend
                                    iconType="circle"
                                    wrapperStyle={{
                                        fontSize: 12,
                                        paddingTop: 10
                                    }}
                                />

                                {categoryNames.map((name, idx) => (
                                    <Bar
                                        key={name}
                                        name={name}
                                        dataKey={name}
                                        stackId="user-category-stack"
                                        fill={`url(#gradStack${idx})`}
                                        radius={idx === categoryNames.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                                        maxBarSize={40}
                                    />
                                ))}
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
                        {filteredExpenses.slice(0, 5).map((expense) => (
                            <div key={expense.ExpenseId} className="expense-item">
                                <div className="expense-info">
                                    <span className="expense-id">#{expense.ExpenseId}</span>
                                    <span className="expense-description">
                                        {expense.Description}
                                    </span>
                                    <span className="expense-category">
                                        {getCategoryName(expense.CategoryId, categories)}
                                    </span>
                                </div>

                                <div className="expense-details">
                                    <span className="expense-amount">
                                        ₹
                                        {parseFloat(expense.Amount).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2
                                        })}
                                    </span>
                                    <span className="expense-user">
                                        {getUserName(expense.UserId, users)}
                                    </span>
                                    <span className="expense-date">{expense.Timestamp}</span>
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
