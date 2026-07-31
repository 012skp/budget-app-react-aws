import React from 'react';
import { addMonths, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

function CalendarPicker({ dateRange, onDateChange }) {
    const handleStartChange = (e) => {
        const newStart = e.target.value;
        onDateChange({ ...dateRange, startDate: newStart });
    };

    const handleEndChange = (e) => {
        const newEnd = e.target.value;
        onDateChange({ ...dateRange, endDate: newEnd });
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

    return (
        <div className="calendar-picker">
            <button
                className="calendar-nav-btn prev"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                type="button"
            >
                ⬅️
            </button>
            <div className="calendar-range">
                <label>From:</label>
                <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={handleStartChange}
                />
                <label>To:</label>
                <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={handleEndChange}
                />
            </div>
            <button
                className="calendar-nav-btn next"
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
