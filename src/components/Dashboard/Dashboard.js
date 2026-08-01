import React, { useMemo } from 'react';
import { getUserName, getCategoryName } from '../../utils/dataHelpers';
import StatCard from './StatCard';
import CategoryChart from './charts/CategoryChart';
import UserChart from './charts/UserChart';
import UserCategoryChart from './charts/UserCategoryChart';
import DayWiseChart from './charts/DayWiseChart';

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

    // Sort categories by total expense so the highest category appears at the top of each stacked bar
    const categoryNames = useMemo(() => {
        const totals = {};
        filteredExpenses.forEach((exp) => {
            const cat = categories.find((c) => c.CategoryId === exp.CategoryId);
            if (cat) {
                const name = cat.CategoryName;
                totals[name] = (totals[name] || 0) + (parseFloat(exp.Amount) || 0);
            }
        });
        // Ascending order puts the highest total last, which becomes the top segment in the stacked bar
        return Object.keys(totals).sort((a, b) => totals[a] - totals[b]);
    }, [filteredExpenses, categories]);

    // Recent expenses: latest 10 within selected date range
    const recentExpensesData = useMemo(() => {
        return [...filteredExpenses]
            .sort((a, b) => (b.Timestamp || '').localeCompare(a.Timestamp || ''))
            .slice(0, 10);
    }, [filteredExpenses]);

    // Daily cumulative + category volume data
    const dailyExpenseData = useMemo(() => {
        if (!startDate || !endDate) return [];

        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = [];
        const current = new Date(start);
        const dayToIndex = {};

        while (current <= end) {
            const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
            const dayObj = {
                day: current.getDate(),
                date: dateStr,
                cumulative: 0
            };
            categories.forEach(cat => {
                dayObj[cat.CategoryName] = 0;
            });
            dayToIndex[dateStr] = dayObj;
            days.push(dayObj);
            current.setDate(current.getDate() + 1);
        }

        const dayTotalMap = {};
        filteredExpenses.forEach(exp => {
            if (!exp.Timestamp) return;
            const dateStr = exp.Timestamp.slice(0, 10);
            const amount = parseFloat(exp.Amount) || 0;
            dayTotalMap[dateStr] = (dayTotalMap[dateStr] || 0) + amount;
            const dayObj = dayToIndex[dateStr];
            if (dayObj) {
                const catName = getCategoryName(exp.CategoryId, categories);
                dayObj[catName] = (dayObj[catName] || 0) + amount;
            }
        });

        let cumulative = 0;
        const cumulativeByCategory = {};
        categories.forEach(cat => {
            cumulativeByCategory[cat.CategoryName] = 0;
        });

        days.forEach(dayObj => {
            cumulative += (dayTotalMap[dayObj.date] || 0);
            dayObj.cumulative = cumulative;

            categories.forEach(cat => {
                const catName = cat.CategoryName;
                cumulativeByCategory[catName] += (dayObj[catName] || 0);
                dayObj[`cum_${catName}`] = cumulativeByCategory[catName];
            });
        });

        return days;
    }, [filteredExpenses, startDate, endDate, categories]);

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
                <StatCard
                    title="Total Expenses"
                    value={`₹${totalExpenses.toLocaleString('en-IN', {
                        minimumFractionDigits: 2
                    })}`}
                    subtitle={`${filteredExpenses.length} transactions`}
                    onClick={() => onNavigate && onNavigate('expenses')}
                />

                {/* Clickable Categories card */}
                <StatCard
                    title="Categories"
                    value={String(categories.length)}
                    subtitle="Active categories"
                    valueClassName="count"
                    onClick={() => onNavigate && onNavigate('categories')}
                />

                {/* Clickable Users card */}
                <StatCard
                    title="Users"
                    value={String(users.length)}
                    subtitle="Active users"
                    valueClassName="count"
                    onClick={() => onNavigate && onNavigate('users')}
                />
            </div>

            <div className="dashboard-charts" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                <CategoryChart data={categoryBreakdown} totalExpenses={totalExpenses} onCategoryClick={handleCategoryClick} />
                <UserChart data={userBreakdown} totalExpenses={totalExpenses} onUserClick={handleUserClick} />
                <UserCategoryChart data={userCategoryBreakdown} categoryNames={categoryNames} />
                <DayWiseChart data={dailyExpenseData} categoryNames={categoryNames} totalExpenses={totalExpenses} />
            </div>

            <div className="recent-expenses">
                <h3>Recent Expenses ({startDate} to {endDate})</h3>

                {loading ? (
                    <p>🔄 Loading expenses from AWS...</p>
                ) : recentExpensesData.length > 0 ? (
                    <div className="expense-list">
                        {recentExpensesData.map((expense) => (
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
