import React, { useState } from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    defs,
    linearGradient,
    stop,
    Cell
} from 'recharts';
import ChartCard from './ChartCard';
import { getCategoryColor } from '../../../utils/chartColors';

function DayWiseChart({ data, userData = [], categoryNames, userNames = [], totalExpenses }) {
    const [seriesType, setSeriesType] = useState('category'); // 'category' | 'user'

    const activeData = seriesType === 'category' ? data : userData;
    const seriesNames = seriesType === 'category' ? categoryNames : userNames;
    const seriesSuffix = seriesType === 'category' ? 'Cat' : 'User';

    const seriesIdxMap = new Map(seriesNames.map((name, idx) => [name, idx]));

    // Today's date in YYYY-MM-DD format (local time)
    const today = new Date();
    const todayStr = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');

    // Only include days up to today. Future dates shouldn't appear because
    // expenses can't be added for future days.
    const rawData = (activeData || []).filter(entry => {
        const datePart = (entry.date || entry.day || '').slice(0, 10);
        // If we don't have a parsable date, keep the entry (this preserves
        // behaviour for fallback/legacy data that only contains a day number).
        if (!/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
            return true;
        }
        return datePart <= todayStr;
    });

    // Build a chart data set where each day has rank keys (c0, c1, ...).
    // Within each day, categories are sorted ascending (smallest first, largest last),
    // so the last rendered bar (highest rank) appears at the top of the stack.
    const chartData = rawData.map(day => {
        const entries = seriesNames
            .map(name => ({ name, value: Number(day[name]) || 0 }))
            .sort((a, b) => a.value - b.value);

        const newDay = { date: day.date, cumulative: day.cumulative };
        entries.forEach((entry, rank) => {
            newDay[`c${rank}`] = entry.value;
            newDay[`c${rank}${seriesSuffix}`] = entry.name;
        });
        return newDay;
    });

    const rankCount = seriesNames.length;
    const ranks = Array.from({ length: rankCount }, (_, i) => i);

    // For a given data point, find the highest rank that actually has a non‑zero value.
    // Because data is sorted ascending, this is the top‑most visible segment.
    const getTopRank = (item) => {
        for (let i = rankCount - 1; i >= 0; i--) {
            if (Number(item[`c${i}`]) > 0) return i;
        }
        return -1;
    };

    // Format a YYYY-MM-DD string as "2 Aug 2026"
    const formatDayTick = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const num = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        const dataPoint = payload[0]?.payload;
        if (!dataPoint) return null;

        const items = payload
            .map(entry => {
                const rank = Number(entry.dataKey.replace('c', ''));
                const name = dataPoint[`${entry.dataKey}${seriesSuffix}`];
                if (!name) return null;
                const value = Number(entry.value) || 0;
                const idx = seriesIdxMap.get(name) ?? 0;
                return {
                    name,
                    value,
                    rank,
                    color: getCategoryColor(name, idx)
                };
            })
            .filter(item => item && item.value > 0)
            .sort((a, b) => b.rank - a.rank); // top first, bottom last

        const dayTotal = items.reduce((sum, item) => sum + item.value, 0);
        const cumulative = Number(dataPoint.cumulative) || 0;
        const totalExp = totalExpenses || 0;
        const cumulativePct = totalExp > 0 ? ((cumulative / totalExp) * 100).toFixed(1) : '0';
        const dayTotalPct = totalExp > 0 ? ((dayTotal / totalExp) * 100).toFixed(1) : '0';

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
                    {formatDayTick(label)}
                </p>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 600,
                        marginTop: 8
                    }}
                >
                    <span>Total Expense{' '}<span style={{ color: '#999', fontSize: 11 }}>({cumulativePct}%)</span></span>
                    <span>₹{num.format(cumulative)}</span>
                </div>

                {items.length > 0 && (
                    <>
                        <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #edf0f7' }} />
                        {items.map(item => (
                            <div
                                key={item.name}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}
                            >
                                <span
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: item.color
                                    }}
                                />
                                <span>
                                    {item.name}{' '}
                                    <span style={{ color: '#999', fontSize: 11 }}>
                                        ({totalExp > 0 ? ((item.value / totalExp) * 100).toFixed(1) : '0'}%)
                                    </span>
                                </span>
                                <span style={{ marginLeft: 'auto', fontWeight: 'normal' }}>
                                    ₹{num.format(item.value)}
                                </span>
                            </div>
                        ))}
                        <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #edf0f7' }} />
                    </>
                )}

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 600,
                        marginTop: 2
                    }}
                >
                    <span>Today's Expense{' '}<span style={{ color: '#999', fontSize: 11 }}>({dayTotalPct}%)</span></span>
                    <span>₹{num.format(dayTotal)}</span>
                </div>
            </div>
        );
    };

    const RenderLegend = () => (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                justifyContent: 'center',
                marginTop: 8
            }}
        >
            {seriesNames.map((name, idx) => (
                <span
                    key={name}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#667' }}
                >
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: getCategoryColor(name, idx)
                        }}
                    />
                    {name}
                </span>
            ))}
        </div>
    );

    const handleToggle = () => {
        setSeriesType(prev => prev === 'category' ? 'user' : 'category');
    };

    if (!activeData || activeData.length === 0 || seriesNames.length === 0) {
        return (
            <ChartCard title="Day Wise Expenses">
                <p style={{ color: '#667', fontSize: 14 }}>No data available</p>
            </ChartCard>
        );
    }

    return (
        <ChartCard
            title={
                seriesType === 'category'
                    ? 'Day Wise Category Expenses'
                    : 'Day Wise User Expenses'
            }
        >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <button
                    type="button"
                    onClick={handleToggle}
                    style={{
                        padding: '4px 12px',
                        border: '1px solid #d0d5e0',
                        borderRadius: '20px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        fontSize: 12,
                        color: '#3A4A6B'
                    }}
                >
                    {seriesType === 'category'
                        ? 'Switch to User view'
                        : 'Switch to Category view'}
                </button>
            </div>

            <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                    <defs>
                        {seriesNames.map((name, idx) => (
                            <linearGradient
                                key={`gradDay${idx}`}
                                id={`gradDay${idx}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="5%" stopColor={getCategoryColor(name, idx)} stopOpacity={0.95} />
                                <stop offset="95%" stopColor={getCategoryColor(name, idx)} stopOpacity={0.6} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDayTick}
                        tick={{ fill: '#667', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={20}
                    />
                    <YAxis
                        tick={{ fill: '#667', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 8 }} />

                    {ranks.map(rank => (
                        <Bar
                            key={`rank${rank}`}
                            dataKey={`c${rank}`}
                            stackId="day-volume"
                            fill="url(#gradDay0)"
                            maxBarSize={40}
                        >
                            {chartData.map((entry, entryIndex) => {
                                const topRank = getTopRank(entry);
                                const isTop = rank === topRank;
                                const seriesName = entry[`c${rank}${seriesSuffix}`];
                                const seriesIdx = seriesIdxMap.get(seriesName) ?? 0;
                                return (
                                    <Cell
                                        key={`cell-${rank}-${entryIndex}`}
                                        fill={`url(#gradDay${seriesIdx})`}
                                        radius={isTop ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                                    />
                                );
                            })}
                        </Bar>
                    ))}

                    <Line
                        type="monotone"
                        dataKey="cumulative"
                        name="Total Expense"
                        stroke="#4F73DF"
                        strokeWidth={2}
                        dot={false}
                        activeDot={false}
                        legendType="plainline"
                    />
                </ComposedChart>
            </ResponsiveContainer>
            <RenderLegend />
        </ChartCard>
    );
}

export default DayWiseChart;
