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
    stop
} from 'recharts';
import ChartCard from './ChartCard';
import ChartTooltip from './ChartTooltip';
import { getCategoryColor } from '../../../utils/chartColors';

function UserCategoryChart({ data, categoryNames }) {
    return (
        <ChartCard title="Expense Per User Per Category">
            <ResponsiveContainer width="100%" height={250}>
                <BarChart
                    data={data}
                    barCategoryGap="15%"
                    barSize={40}
                    margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
                >
                    <defs>
                        {categoryNames.map((name, idx) => (
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

                    {categoryNames.map((name, idx) => (
                        <Bar
                            key={name}
                            name={name}
                            dataKey={name}
                            stackId="user-category-stack"
                            fill={`url(#gradStack${idx})`}
                            radius={idx === categoryNames.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                            maxBarSize={40}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}

export default UserCategoryChart;
