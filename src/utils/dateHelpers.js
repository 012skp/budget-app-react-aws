import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const dateHelpers = {
    // Get current month start and end
    getCurrentMonth: () => {
        const now = new Date();
        return {
            start: format(startOfMonth(now), 'yyyy-MM-dd'),
            end: format(endOfMonth(now), 'yyyy-MM-dd'),
            year: now.getFullYear(),
            month: now.getMonth() + 1,
        };
    },

    // Get previous month
    getPreviousMonth: () => {
        const prevMonth = subMonths(new Date(), 1);
        return {
            start: format(startOfMonth(prevMonth), 'yyyy-MM-dd'),
            end: format(endOfMonth(prevMonth), 'yyyy-MM-dd'),
            year: prevMonth.getFullYear(),
            month: prevMonth.getMonth() + 1,
        };
    },

    // Format date for display
    formatDate: (date) => format(new Date(date), 'MMM dd, yyyy'),

    // Format date for API
    formatDateForAPI: (date) => format(new Date(date), 'yyyy-MM-dd'),

    // Get month name
    getMonthName: (month, year) => format(new Date(year, month - 1), 'MMMM yyyy'),
};
