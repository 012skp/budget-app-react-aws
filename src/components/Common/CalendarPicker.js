import React from 'react';

function CalendarPicker({ dateRange, onDateChange }) {
    const handleStartChange = (e) => {
        onDateChange({ ...dateRange, startDate: e.target.value });
    };

    const handleEndChange = (e) => {
        onDateChange({ ...dateRange, endDate: e.target.value });
    };

    return (
        <div className="calendar-picker">
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
        </div>
    );
}

export default CalendarPicker;
