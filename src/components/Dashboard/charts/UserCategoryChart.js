import React, { useState, useMemo } from 'react';
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
    // Toggle between viewing by user (stacks = categories) and by category (stacks = users)
    const [orientation, setOrientation] = useState('user'); // 'user' | 'category'

    // All user names that appear in the data (order determined by the data array)
    const userNames = useMemo(() => {
        const names = [];
        const seen = new Set();
        data.forEach(item => {
            if (!seen.has(item.name)) {
                seen.add(item.name);
                names.push(item.name);
            }
        });
        return names;
    }, [data]);

    // Map category -> user -> total, used when orientation === 'category'
    const userCategoryAmountMap = useMemo(() => {
        const map = {};
        data.forEach(user => {
            const userName = user.name;
            categoryNames.forEach(cat => {
                const val = Number(user[cat]) || 0;
                if (!map[cat]) map[cat] = {};
                map[cat][userName] = (map[cat][userName] || 0) + val;
            });
        });
        return map;
    }, [data, categoryNames]);

    // When viewing per category, sort categories by total descending so the largest is on the left
    const sortedCategoryNames = useMemo(() => {
        if (orientation !== 'category') return categoryNames;
        return categoryNames
            .map(cat => ({
                cat,
                total: data.reduce((sum, user) => sum + (Number(user[cat]) || 0), 0)
            }))
            .sort((a, b) => b.total - a.total)
            .map(item => item.cat);
    }, [data, categoryNames, orientation]);

    const catIdxMap = useMemo(() => new Map(categoryNames.map((cat, idx) => [cat, idx])), [categoryNames]);
    const userIdxMap = useMemo(() => new Map(userNames.map((name, idx) => [name, idx])), [userNames]);

    // Determine which labels appear as stack segments
    const stackLabels = orientation === 'user' ? categoryNames : userNames;
    const rankCount = stackLabels.length;
    const ranks = Array.from({ length: rankCount }, (_, i) => i);

    // Build chart data according to the current orientation
    const chartData = useMemo(() => {
        if (orientation === 'user') {
            return data.map(user => {
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
        } else {
            return sortedCategoryNames.map(cat => {
                const entries = userNames
                    .map(userName => ({ user: userName, value: Number(userCategoryAmountMap[cat]?.[userName]) || 0 }))
                    .sort((a, b) => a.value - b.value);

                const newCategory = { name: cat };
                entries.forEach((entry, rank) => {
                    newCategory[`c${rank}`] = entry.value;
                    newCategory[`c${rank}User`] = entry.user;
                });
                return newCategory;
            });
        }
    }, [data, categoryNames, userNames, orientation, userCategoryAmountMap, sortedCategoryNames]);

    // Use the actual pixel width of the longest label to determine chart min width.
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

    // For a given data point, find the highest rank that actually has a non-zero value.
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

        const isUserOrientation = orientation === 'user';
        const labelSuffix = isUserOrientation ? 'Cat' : 'User';

        const items = payload
            .map(entry => {
                const rank = Number(entry.dataKey.replace('c', ''));
                const displayName = entry.payload[`${entry.dataKey}${labelSuffix}`];
                const value = Number(entry.value) || 0;
                const idx = isUserOrientation
                    ? (catIdxMap.get(displayName) ?? 0)
                    : (userIdxMap.get(displayName) ?? 0);
                return {
                    displayName,
                    value,
                    rank,
                    color: getCategoryColor(displayName, idx)
                };
            })
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
                                key={item.displayName}
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
                                    {item.displayName}{' '}
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
            {stackLabels.map((label, idx) => (
                <span
                    key={label}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#667' }}
                >
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: getCategoryColor(label, idx)
                        }}
                    />
                    {label}
                </span>
            ))}
        </div>
    );

    const handleToggle = () => {
        setOrientation(prev => prev === 'user' ? 'category' : 'user');
    };

    if (!data || !categoryNames || data.length === 0) {
        return (
            <ChartCard title="Expense Distribution">
                <p style={{ color: '#667', fontSize: 14 }}>No data available</p>
            </ChartCard>
        );
    }

    return (
        <ChartCard title="Expense Breakdown">
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
                    {orientation === 'user'
                        ? 'Switch to Category view'
                        : 'Switch to User view'}
                </button>
            </div>

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
                                {stackLabels.map((label, idx) => (
                                    <linearGradient
                                        key={`gradStack${idx}`}
                                        id={`gradStack${idx}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop offset="5%" stopColor={getCategoryColor(label, idx)} stopOpacity={0.95} />
                                        <stop offset="95%" stopColor={getCategoryColor(label, idx)} stopOpacity={0.6} />
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
                                    fill="url(#gradStack0)"
                                    maxBarSize={40}
                                >
                                    {chartData.map((entry, entryIndex) => {
                                        const topRank = getTopRank(entry);
                                        const isTop = rank === topRank;
                                        const stackName = orientation === 'user'
                                            ? entry[`c${rank}Cat`]
                                            : entry[`c${rank}User`];
                                        const stackIdx = orientation === 'user'
                                            ? (catIdxMap.get(stackName) ?? 0)
                                            : (userIdxMap.get(stackName) ?? 0);
                                        return (
                                            <Cell
                                                key={`cell-${rank}-${entryIndex}`}
                                                fill={`url(#gradStack${stackIdx})`}
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
