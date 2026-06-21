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
            alert('Failed to add expense');
        }
    };

    return (
        <div className="page">
            <h2>➕ Add Expense</h2>

            <form onSubmit={handleSubmit}>

                <div>
                    <label>User</label>
                    <br />

                    <select
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        required
                    >
                        <option value="">Select User</option>

                        {users.map(user => (
                            <option
                                key={user.UserId}
                                value={user.UserId}
                            >
                                {user.Name}
                            </option>
                        ))}
                    </select>
                </div>

                <br />

                <div>
                    <label>Category</label>
                    <br />

                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        required
                    >
                        <option value="">Select Category</option>

                        {categories.map(category => (
                            <option
                                key={category.CategoryId}
                                value={category.CategoryId}
                            >
                                {category.CategoryName}
                            </option>
                        ))}
                    </select>
                </div>

                <br />

                <div>
                    <label>Amount</label>
                    <br />

                    <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Description</label>
                    <br />

                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <br />

                <button type="submit">
                    Save Expense
                </button>

            </form>
        </div>
    );
}

export default AddExpense;