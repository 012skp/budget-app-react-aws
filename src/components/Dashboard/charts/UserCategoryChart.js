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
            <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
                <strong>{label}</strong>
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
                            {item.cat} ({total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'}%):
                        </span>
                        <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>
                            {item.value.toFixed(2)}
                        </span>
                    </div>
                ))}
                {items.length > 0 && (
                    <div
                        style={{
                            marginTop: 8,
                            borderTop: '1px solid #eee',
                            paddingTop: 4,
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}
                    >
                        <span>Total</span>
                        <strong>{total.toFixed(2)}</strong>
                    </div>
                )}
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
            <ResponsiveContainer width="100%" height={250}>
                <BarChart
                    data={chartData}
                    barCategoryGap="15%"
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
            <RenderLegend />
        </ChartCard>
    );
}

export default UserCategoryChart;
