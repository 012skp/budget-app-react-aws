import React from 'react';

function DayWiseTooltip({ active, payload, totalExpenses }) {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    if (!data || data.cumulative === undefined) return null;
    const totalTillDay = data.cumulative || 0;

    // Format date as e.g. "1 Aug 2026"
    const dateObj = new Date(data.date + 'T00:00:00');
    const dateLabel = dateObj.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    // Get positive categories, excluding the cumulative total line
    const categories = payload
        .filter(item => item.name !== 'Total Expense')
        .filter(item => (Number(item.value) || 0) > 0)
        .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));

    // Today's expense = sum of all positive category amounts
    const todayExpense = categories.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

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
            <p style={{ margin: 0, fontWeight: 600, color: '#333' }}>
                {dateLabel}
            </p>
            <p style={{ margin: '6px 0 0', color: '#4F73DF', fontWeight: 600 }}>
                Total Expense: ₹{totalTillDay.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}
            </p>
            <p style={{ margin: '6px 0 0', color: '#333', fontWeight: 600 }}>
                Today's Expense: ₹{todayExpense.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}
            </p>
            {categories.map((item, idx) => {
                const dailyAmount = Number(item.value) || 0;
                const catName = item.name;
                const pct = totalExpenses > 0 ? (dailyAmount / totalExpenses) * 100 : 0;

                return (
                    <p
                        key={idx}
                        style={{
                            margin: '6px 0 0',
                            color: item.color || item.fill || '#333',
                            fontWeight: 500
                        }}
                    >
                        {catName} ({pct.toFixed(1)}%): ₹{dailyAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </p>
                );
            })}
        </div>
    );
}

export default DayWiseTooltip;
