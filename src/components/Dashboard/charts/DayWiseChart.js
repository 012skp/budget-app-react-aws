import React from 'react';
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
import DayWiseTooltip from './DayWiseTooltip';
import { getCategoryColor } from '../../../utils/chartColors';

function DayWiseChart({ data, categoryNames, totalExpenses }) {
    const catIdxMap = new Map(categoryNames.map((cat, idx) => [cat, idx]));

    // Today's date in YYYY-MM-DD format (local time)
    const today = new Date();
    const todayStr = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');

    // Only include days up to today. Future dates shouldn't appear because
    // expenses can't be added for future days.
    const rawData = (data || []).filter(entry => {
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
        const entries = categoryNames
            .map(cat => ({ cat, value: Number(day[cat]) || 0 }))
            .sort((a, b) => a.value - b.value);

        const newDay = { date: day.date, cumulative: day.cumulative };
        entries.forEach((entry, rank) => {
            newDay[`c${rank}`] = entry.value;
            newDay[`c${rank}Cat`] = entry.cat;
        });
        return newDay;
    });

    const rankCount = categoryNames.length;
    const ranks = Array.from({ length: rankCount }, (_, i) => i);

    // For a given data point, find the highest rank that actually has a non‑zero value.
    // Because data is sorted ascending, this is the top‑most visible segment.
    const getTopRank = (item) => {
        for (let i = rankCount - 1; i >= 0; i--) {
            if (Number(item[`c${i}`]) > 0) return i;
        }
        return -1;
    };

    // Format a YYYY-MM-DD string as "1 Jul" or "31 Aug"
    const formatDayTick = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short'
        });
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
            {categoryNames.map((cat, idx) => (
                <span
                    key={cat}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#667' }}
                >
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: getCategoryColor(cat, idx)
                        }}
                    />
                    {cat}
                </span>
            ))}
        </div>
    );

    return (
        <ChartCard title="Day Wise Expenses">
            <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                    <defs>
                        {categoryNames.map((name, idx) => (
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
                        label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                        tick={{ fill: '#667', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<DayWiseTooltip categoryNames={categoryNames} totalExpenses={totalExpenses} />} cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 8 }} />

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
                                const catName = entry[`c${rank}Cat`];
                                const catIdx = catIdxMap.get(catName) ?? 0;
                                return (
                                    <Cell
                                        key={`cell-${rank}-${entryIndex}`}
                                        fill={`url(#gradDay${catIdx})`}
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
