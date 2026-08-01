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
    Legend,
    defs,
    linearGradient,
    stop
} from 'recharts';
import ChartCard from './ChartCard';
import DayWiseTooltip from './DayWiseTooltip';
import { getCategoryColor } from '../../../utils/chartColors';

function DayWiseChart({ data, categoryNames, totalExpenses }) {
    // Today's date in YYYY-MM-DD format (local time)
    const today = new Date();
    const todayStr = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');

    // Only include days up to today. Future dates shouldn't appear because
    // expenses can't be added for future days.
    const chartData = (data || []).filter(entry => {
        const datePart = (entry.date || entry.day || '').slice(0, 10);
        // If we don't have a parsable date, keep the entry (this preserves
        // behaviour for fallback/legacy data that only contains a day number).
        if (!/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
            return true;
        }
        return datePart <= todayStr;
    });

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
                        dataKey="day"
                        tick={{ fill: '#667', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Day', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                        tick={{ fill: '#667', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<DayWiseTooltip totalExpenses={totalExpenses} />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />

                    {categoryNames.map((name, idx) => (
                        <Bar
                            key={name}
                            name={name}
                            dataKey={name}
                            stackId="day-volume"
                            fill={`url(#gradDay${idx})`}
                            radius={idx === categoryNames.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                            maxBarSize={40}
                            legendType="circle"
                        />
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
        </ChartCard>
    );
}

export default DayWiseChart;
