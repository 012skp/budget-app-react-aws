import React from 'react';

function StatCard({ title, value, subtitle, onClick, valueClassName = 'amount' }) {
    return (
        <button className="stat-card" type="button" onClick={onClick}>
            <h3>{title}</h3>
            <p className={valueClassName}>{value}</p>
            {subtitle && <small>{subtitle}</small>}
        </button>
    );
}

export default StatCard;
