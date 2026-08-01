import React from 'react';

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;

    const total = payload.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    const sortedPayload = payload
        .slice()
        .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));

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
            <p style={{ margin: 0, fontWeight: 600, color: '#333' }}>{label}</p>
            {sortedPayload.map((item, idx) => {
                const pct = sortedPayload.length > 1 && total > 0
                    ? ((Number(item.value) / total) * 100)
                    : null;
                const displayName = pct !== null
                    ? `${item.name} (${pct.toFixed(1)}%)`
                    : item.name;

                return (
                    <p
                        key={idx}
                        style={{
                            margin: '6px 0 0',
                            color: item.color || item.fill || '#333',
                            fontWeight: 500
                        }}
                    >
                        {displayName}: ₹{Number(item.value).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </p>
                );
            })}
        </div>
    );
}

export default ChartTooltip;
