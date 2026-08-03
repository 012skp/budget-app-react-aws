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

// Approximate or measure the pixel width of a piece of text at the chart's tick font.
function getTextWidth(text, font = '12px sans-serif') {
    if (typeof document === 'undefined' || !text) {
        return text ? text.length * 7 : 0;
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        return text.length * 7;
    }
    context.font = font;
    return context.measureText(text).width;
}

function UserChart({ data, totalExpenses, onUserClick }) {
    // Use the actual pixel width of the longest user name to determine
    // the smallest chart width that won't cause x‑axis labels to overlap.
    const longestLabelWidth = Math.max(
        ...(data.map(item => (item.name ? getTextWidth(item.name) : 0))),
        0
    );
    const minBarWidth = Math.max(
        60,
        Math.ceil(longestLabelWidth + 12)
    );
    const chartMinWidth = Math.max(data.length * minBarWidth, 400);

    return (
        <ChartCard title="Expenses Per User">
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ minWidth: chartMinWidth }}>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data} barCategoryGap={8} barSize={40} margin={{ top: 35, right: 20, left: 20, bottom: 5 }}>
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
