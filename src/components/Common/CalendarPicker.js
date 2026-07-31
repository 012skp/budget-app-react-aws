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
        margin: '0 2px',
        fontSize: '1.5rem',
        cursor: 'pointer',
        lineHeight: 1,
        color: 'inherit',
    };

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <button
                style={arrowStyle}
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                type="button"
            >
                ⬅️
            </button>
            <div className="calendar-picker">
                <div className="calendar-range">
                    <label style={{ marginRight: '4px' }}>From:</label>
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={handleStartChange}
                    />
                    <label style={{ marginLeft: '4px', marginRight: '4px' }}>To:</label>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={handleEndChange}
                    />
                </div>
            </div>
            <button
                style={arrowStyle}
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                type="button"
            >
                ➡️
            </button>
        </div>
    );
}

export default CalendarPicker;
