import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    defs,
    linearGradient,
    stop,
    Cell
} from 'recharts';
import ChartCard from './ChartCard';
import ChartTooltip from './ChartTooltip';
import { getCategoryColor } from '../../../utils/chartColors';

function UserCategoryChart({ data, categoryNames }) {
    // Sort categories by total expense ASCENDING.
    // Because Recharts stacks bars in the order they are rendered,
    // the last rendered <Bar> appears at the top of the stack.
    // Therefore the category with the highest total is placed LAST,
    // which puts it at the very top.
    const sortedCategories = categoryNames.slice().sort((a, b) => {
        const totalA = data.reduce((sum, item) => sum + (Number(item[a]) || 0), 0);
        const totalB = data.reduce((sum, item) => sum + (Number(item[b]) || 0), 0);
        return totalA - totalB;
    });

    // Rebuild data objects so the category keys are present in the same order
    // as the <Bar> components. This makes the stacking order explicit and
    // avoids any ambiguity from the original data key order.
    const chartData = data.map(item => {
        const newItem = { name: item.name };
        sortedCategories.forEach(cat => {
            newItem[cat] = item[cat];
        });
        return newItem;
    });

    // For each data point, find which category is actually the top of the stack.
    // In the rendering order, the top segment is the last category (highest index)
    // that has a non-zero value.
    const getTopCategoryIndex = (item) => {
        for (let idx = sortedCategories.length - 1; idx >= 0; idx--) {
            const cat = sortedCategories[idx];
            if (Number(item[cat]) > 0) return idx;
        }
        return -1;
    };

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
                        {sortedCategories.map((name, idx) => (
                            <linearGradient
                                key={`gradStack${idx}`}
                                id={`gradStack${idx}`}
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
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 8 }} />
                    <Legend
                        iconType="circle"
                        wrapperStyle={{
                            fontSize: 12,
                            paddingTop: 10
                        }}
                    />

                    {sortedCategories.map((name, idx) => (
                        <Bar
                            key={name}
                            name={name}
                            dataKey={name}
                            stackId="user-category-stack"
                            fill={`url(#gradStack${idx})`}
                            maxBarSize={40}
                        >
                            {chartData.map((entry, entryIndex) => {
                                const topIdx = getTopCategoryIndex(entry);
                                const isTop = idx === topIdx;
                                return (
                                    <Cell
                                        key={`cell-${idx}-${entryIndex}`}
                                        radius={isTop ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                                    />
                                );
                            })}
                        </Bar>
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}

export default UserCategoryChart;
