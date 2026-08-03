import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
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

function UserCategoryChart({ data, categoryNames }) {
    const catIdxMap = new Map(categoryNames.map((cat, idx) => [cat, idx]));

    // Build a chart data set where each user has rank keys (c0, c1, ...).
    // Within each user, categories are sorted ascending (smallest first, largest last),
    // so the last rendered bar (highest rank) appears at the top of the stack.
    const chartData = data.map(user => {
        const entries = categoryNames
            .map(cat => ({ cat, value: Number(user[cat]) || 0 }))
            .sort((a, b) => a.value - b.value);

        const newUser = { name: user.name };
        entries.forEach((entry, rank) => {
            newUser[`c${rank}`] = entry.value;
            newUser[`c${rank}Cat`] = entry.cat;
        });
        return newUser;
    });

    // Use the actual pixel width of the longest user name to determine
    // the smallest chart width that won't cause x‑axis labels to overlap.
    const longestLabelWidth = Math.max(
        ...(chartData.map(item => (item.name ? getTextWidth(item.name) : 0))),
        0
    );
    const leftMargin = 20;
    const rightMargin = 20;
    const categoryMinWidth = Math.max(
        60,
        Math.ceil(longestLabelWidth + 16)
    );
    const chartMinWidth = leftMargin + rightMargin + chartData.length * categoryMinWidth;

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

    const num = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;

        const items = payload
            .map(entry => ({
                rank: Number(entry.dataKey.replace('c', '')),
                cat: entry.payload[`${entry.dataKey}Cat`],
                value: Number(entry.value) || 0
            }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.rank - a.rank); // top first, bottom last

        const total = items.reduce((sum, item) => sum + item.value, 0);

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
                    {label}
                </p>

                {items.length > 0 && (
                    <>
                        <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #edf0f7' }} />
                        {items.map(item => (
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
                                        ({total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'}%)
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
                        fontWeight: 600
                    }}
                >
                    <span>Total Expense</span>
                    <span>₹{num.format(total)}</span>
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
        <ChartCard title="Expense Per User Per Category">
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ width: chartMinWidth }}>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                            data={chartData}
                            barCategoryGap={8}
                            barSize={40}
                            margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
                        >
                            <defs>
                                {categoryNames.map((name, idx) => (
                                    <linearGradient
                                        key={`gradCat${idx}`}
                                        id={`gradCat${idx}`}
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
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 8 }} />

                            {ranks.map(rank => (
                                <Bar
                                    key={`rank${rank}`}
                                    dataKey={`c${rank}`}
                                    stackId="user-category-stack"
                                    fill="url(#gradCat0)"
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
                                                fill={`url(#gradCat${catIdx})`}
                                                radius={isTop ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                                            />
                                        );
                                    })}
                                </Bar>
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <RenderLegend />
        </ChartCard>
    );
}

export default UserCategoryChart;
