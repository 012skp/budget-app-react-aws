import {getCategoryName, getUserName} from "../../utils/dataHelpers";

import { expenseAPI } from '../../services/api';

import React, { useState } from 'react';

function ExpenseList({filteredExpenses, users, categories, dateRange, loading, onRefresh}) {
    const [editingExpenseId, setEditingExpenseId] = useState(null);

    const [editForm, setEditForm] = useState({
        UserId: '',
        CategoryId: '',
        Amount: '',
        Description: ''
    });

    // Filtering is now done in App – use the directly passed filteredExpenses
    // No need to filter again

    const handleEditClick = (expense) => {

        setEditingExpenseId(expense.ExpenseId);

        setEditForm({
            UserId: expense.UserId,
            CategoryId: expense.CategoryId,
            Amount: expense.Amount,
            Description: expense.Description
        });
    };

    const handleSave = async () => {

        try {

            await expenseAPI.updateExpense(
                editingExpenseId,
                editForm.UserId,
                editForm.CategoryId,
                editForm.Amount,
                editForm.Description
            );

            alert('Expense updated successfully');

            setEditingExpenseId(null);

            if (onRefresh) {
                await onRefresh();
            }

        } catch (error) {

            console.error(error);
            alert('Failed to update expense');

        }
    };

    const handleCancel = () => {
        setEditingExpenseId(null);
    };

    const handleDelete = async (expenseId) => {

        const confirmed = window.confirm(
            `Delete expense #${expenseId}?`
        );

        if (!confirmed) {
            return;
        }

        try {

            await expenseAPI.deleteExpense(expenseId);

            alert('Expense deleted successfully');

            if (onRefresh) {
                await onRefresh();
            }

        } catch (error) {
            console.error(error);
            alert('Failed to delete expense');
        }
    };

    const rangeLabel = dateRange
        ? ` (${dateRange.startDate} to ${dateRange.endDate})`
        : '';

    return (
        <div className="page">
            <h2>📋 All Expenses{rangeLabel}</h2>
            {loading ? (
                <p>🔄 Loading expenses from AWS...</p>
            ) : filteredExpenses.length > 0 ? (
                <div className="expense-table">
                    <div className="table-header">
                        <span>ID</span>
                        <span>Date</span>
                        <span>Description</span>
                        <span>Category</span>
                        <span>User</span>
                        <span>Amount</span>
                        <span>Actions</span>
                    </div>
                    {filteredExpenses.map(expense => (

                        editingExpenseId === expense.ExpenseId ? (

                            <div key={expense.ExpenseId} className="table-row">

                                <span>{expense.ExpenseId}</span>

                                <span>{expense.Timestamp}</span>

                                <input
                                    value={editForm.Description}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            Description: e.target.value
                                        })
                                    }
                                />

                                <select
                                    value={editForm.CategoryId}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            CategoryId: Number(e.target.value)
                                        })
                                    }
                                >
                                    {categories.map(category => (
                                        <option
                                            key={category.CategoryId}
                                            value={category.CategoryId}
                                        >
                                            {category.CategoryName}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={editForm.UserId}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            UserId: Number(e.target.value)
                                        })
                                    }
                                >
                                    {users.map(user => (
                                        <option
                                            key={user.UserId}
                                            value={user.UserId}
                                        >
                                            {user.Name}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.Amount}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            Amount: e.target.value
                                        })
                                    }
                                />

                                <span>
                                    <button onClick={handleSave}>
                                        💾 Save
                                    </button>

                                    <button onClick={handleCancel}>
                                        ❌ Cancel
                                    </button>
                                </span>

                            </div>

                        ) : (

                            <div
                                key={expense.ExpenseId}
                                className="table-row"
                            >
                                <span>{expense.ExpenseId}</span>

                                <span>{expense.Timestamp}</span>

                                <span>{expense.Description}</span>

                                <span>
                                    {getCategoryName(expense.CategoryId, categories)}
                                </span>

                                <span>
                                    {getUserName(expense.UserId, users)}
                                </span>

                                <span>
                                    ₹{parseFloat(expense.Amount).toFixed(2)}
                                </span>

                                <span>
                                    <button onClick={() => handleEditClick(expense)}>
                                        ✏️ Edit
                                    </button>

                                    <button onClick={() => handleDelete(expense.ExpenseId)}>
                                        🗑 Delete
                                    </button>
                                </span>
                            </div>

                        )
                    ))}
                </div>
            ) : (
                <p>No expenses found{rangeLabel}.</p>
            )}
        </div>
    );
}

export default ExpenseList;
