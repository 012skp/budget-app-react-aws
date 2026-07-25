import React from 'react';

function CalendarPicker({ dateRange, onDateChange }) {
    const handleStartChange = (e) => {
        const newStart = e.target.value;
        onDateChange({ ...dateRange, startDate: newStart });
    };

    const handleEndChange = (e) => {
        const newEnd = e.target.value;
        onDateChange({ ...dateRange, endDate: newEnd });
    };

    return (
        <div className="calendar-picker">
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
    );
}

export default CalendarPicker;
