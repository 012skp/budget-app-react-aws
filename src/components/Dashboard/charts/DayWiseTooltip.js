import React from 'react';
import { getCategoryColor } from '../../../utils/chartColors';

function DayWiseTooltip({ active, payload, categoryNames = [], totalExpenses }) {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    if (!data || data.cumulative === undefined) return null;

    const totalTillDay = data.cumulative || 0;

    // The denominator for the percentage is the total expense as of the last day,
    // not the cumulative expense up to the current day.
    const denominator = totalExpenses || totalTillDay;

    // Format date as e.g. "1 Aug 2026"
    const dateObj = new Date(data.date + 'T00:00:00');
    const dateLabel = dateObj.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    const catIdxMap = new Map(categoryNames.map((cat, idx) => [cat, idx]));

    // Extract the per-category segments from the payload.
    // Only Bar entries with dataKey like "c0", "c1", ... are considered.
    const rankRegex = /^c(\d+)$/;
    const items = payload
        .map(entry => {
            const match = entry.dataKey.toString().match(rankRegex);
            if (!match) return null;
            const rank = Number(match[1]);
            const cat = entry.payload[`c${rank}Cat`];
            const value = Number(entry.value) || 0;
            return { rank, cat, value };
        })
        .filter(item => item && item.value > 0)
        .sort((a, b) => b.rank - a.rank); // top of stack first (largest expense first)

    const todayExpense = items.reduce((sum, item) => sum + item.value, 0);

    const num = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const totalPct = denominator > 0 ? (totalTillDay / denominator) * 100 : 0;
    const todayPct = denominator > 0 ? (todayExpense / denominator) * 100 : 0;

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
            <p
                style={{
                    margin: '6px 0 0',
                    color: '#4F73DF',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <span>Total Expense</span>
                <span>₹{num.format(totalTillDay)} ({totalPct.toFixed(1)}%)</span>
            </p>

            {items.length > 0 && (
                <>
                    <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #edf0f7' }} />
                    {items.map(item => {
                        const pct = denominator > 0 ? (item.value / denominator) * 100 : 0;
                        return (
                            <div
                                key={item.cat}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}
                            >
                                <span
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: getCategoryColor(item.cat, catIdxMap.get(item.cat) ?? 0)
                                    }}
                                />
                                <span>
                                    {item.cat}{' '}
                                    <span style={{ color: '#999', fontSize: 11 }}>
                                        ({pct.toFixed(1)}%)
                                    </span>
                                </span>
                                <span style={{ marginLeft: 'auto', fontWeight: 'normal' }}>
                                    ₹{num.format(item.value)}
                                </span>
                            </div>
                        );
                    })}
                    <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #edf0f7' }} />
                </>
            )}

            <p
                style={{
                    margin: '6px 0 0',
                    color: '#333',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <span>Today's Expense</span>
                <span>₹{num.format(todayExpense)} ({todayPct.toFixed(1)}%)</span>
            </p>
        </div>
    );
}

export default DayWiseTooltip;
