import { useState, useCallback } from 'react';
import { expenseAPI } from '../services/api';

const SAMPLE_EXPENSES = [
    {
        expense_id: '1',
        amount: 1250.00,
        category_name: 'Food',
        description: 'Grocery shopping',
        expense_date: '2024-06-15',
        user_name: 'John Doe'
    },
    {
        expense_id: '2',
        amount: 850.00,
        category_name: 'Transport',
        description: 'Uber rides',
        expense_date: '2024-06-14',
        user_name: 'Jane Smith'
    }
];

export function useExpenses(dateRange) {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiStatus, setApiStatus] = useState('connecting');

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        setApiStatus('connecting');

        try {
            const expensesRes = await expenseAPI.getExpensesByDateRange(
                dateRange.startDate,
                dateRange.endDate
            );

            setExpenses(expensesRes.data.expenses || []);
            setApiStatus('connected');
        } catch (error) {
            console.error('❌ API Error:', error);
            setApiStatus('error');

            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to load expenses. Using sample data instead.';
            alert(msg);

            setExpenses(SAMPLE_EXPENSES);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    return { expenses, setExpenses, loading, apiStatus, fetchExpenses };
}
