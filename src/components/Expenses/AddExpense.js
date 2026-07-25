import React, { useState } from 'react';
import { expenseAPI } from '../../services/api';

function AddExpense({ users, categories, onExpenseAdded }) {
    const [userId, setUserId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await expenseAPI.addExpense(
                parseInt(userId),
                parseInt(categoryId),
                parseFloat(amount),
                description
            );

            alert('Expense added successfully');

            setUserId('');
            setCategoryId('');
            setAmount('');
            setDescription('');

            onExpenseAdded();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to add expense';
            alert(msg);
        }
    };

    return (
        <div className="page">
            <div className="form-card">
                <h2>➕ Add Expense</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">User</label>
                        <select
                            className="form-select"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        >
                            <option value="">Select User</option>
                            {users.map(user => (
                                <option key={user.UserId} value={user.UserId}>
                                    {user.Name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                            className="form-select"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            required
                        >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                                <option key={category.CategoryId} value={category.CategoryId}>
                                    {category.CategoryName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Amount</label>
                        <input
                            className="form-input"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <button className="btn-primary" type="submit">
                        Save Expense
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AddExpense;
