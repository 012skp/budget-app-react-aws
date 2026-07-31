import React from 'react';
import { addMonths, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

function CalendarPicker({ dateRange, onDateChange }) {
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

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', padding: 0, margin: 0, background: 'transparent' }}>
            <button
                style={arrowStyle}
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                type="button"
            >
                ⬅
            </button>
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
