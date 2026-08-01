import React from 'react';

function ChartCard({ title, children }) {
    return (
        <div className="chart-card" style={{ flex: '1 1 300px', minWidth: '0' }}>
            <div className="chart-container" style={{ width: '100%' }}>
                <h3>{title}</h3>
                {children}
            </div>
        </div>
    );
}

export default ChartCard;
