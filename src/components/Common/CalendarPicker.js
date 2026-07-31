import React from 'react';
import { addMonths, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

function CalendarPicker({ dateRange, onDateChange }) {
    const handleStartChange = (e) => {
        onDateChange({ ...dateRange, startDate: e.target.value });
    };

    const handleEndChange = (e) => {
        onDateChange({ ...dateRange, endDate: e.target.value });
    };

    const shiftMonth = (direction) => {
        if (!dateRange || !dateRange.startDate) return;

        const currentStart = new Date(dateRange.startDate);
        const firstOfCurrentMonth = startOfMonth(currentStart);
        const firstOfTargetMonth = direction > 0
            ? addMonths(firstOfCurrentMonth, 1)
            : subMonths(firstOfCurrentMonth, 1);
        const newEndDate = endOfMonth(firstOfTargetMonth);

        onDateChange({
            startDate: format(firstOfTargetMonth, 'yyyy-MM-dd'),
            endDate: format(newEndDate, 'yyyy-MM-dd'),
        });
    };

    const arrowStyle = {
        background: 'transparent',
        border: 'none',
        padding: 0,
        margin: '0 4px',
        fontSize: '1.5rem',
        cursor: 'pointer',
        color: 'inherit',
        lineHeight: 1,
    };

    const containerStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        background: 'transparent',
        padding: 0,
        margin: 0,
    };

    const inputStyle = {
        margin: '0 4px',
        background: 'transparent',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '2px 4px',
    };

    return (
        <div style={containerStyle}>
            <button
                style={arrowStyle}
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                type="button"
            >
                ⬅
            </button>
            <input
                type="date"
                style={inputStyle}
                value={dateRange.startDate}
                onChange={handleStartChange}
            />
            <span style={{ margin: '0 2px', color: 'inherit' }}>to</span>
            <input
                type="date"
                style={inputStyle}
                value={dateRange.endDate}
                onChange={handleEndChange}
            />
            <button
                style={arrowStyle}
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                type="button"
            >
                ➡
            </button>
        </div>
    );
}

export default CalendarPicker;
