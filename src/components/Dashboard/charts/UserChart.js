import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LabelList,
    Tooltip,
    defs,
    linearGradient,
    stop
} from 'recharts';
import ChartCard from './ChartCard';
import ChartTooltip from './ChartTooltip';

function UserChart({ data, totalExpenses, onUserClick }) {
    // Each bar gets roughly 80px of width; enforce a minimum so very few users still render nicely
    const chartMinWidth = Math.max(data.length * 80, 400);

    return (
        <ChartCard title="Expenses Per User">
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ minWidth: chartMinWidth }}>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data} barCategoryGap="15%" margin={{ top: 35, right: 20, left: 20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="gradUser" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4F73DF" stopOpacity={0.9} />
                                    <stop offset="95%" stopColor="#4F73DF" stopOpacity={0.4} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#667', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                            />
                            <YAxis
                                tick={{ fill: '#667', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 8 }} />
                            <Bar
                                name="Amount"
                                dataKey="total"
                                fill="url(#gradUser)"
                                radius={[8, 8, 0, 0]}
                                maxBarSize={40}
                                onClick={onUserClick}
                            >
                                <LabelList
                                    dataKey="total"
                                    position="top"
                                    style={{ fontWeight: 'bold', fill: '#333', fontSize: 13 }}
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
        </ChartCard>
    );
}

export default UserChart;
