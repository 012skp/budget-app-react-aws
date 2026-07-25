import {getCategoryName, getUserName} from "../../utils/dataHelpers";
import { expenseAPI } from '../../services/api';
import React, { useState, useMemo } from 'react';

function ExpenseList({filteredExpenses, users, categories, dateRange, loading, onRefresh}) {
    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const [editForm, setEditForm] = useState({
        UserId: '',
        CategoryId: '',
        Amount: '',
        Description: ''
    });

    // Filter / sort / pagination state
    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [sortField, setSortField] = useState('Timestamp'); // Timestamp, Amount, Description
    const [sortDirection, setSortDirection] = useState('desc'); // asc / desc
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Apply client‑side filter and sort
    const processedExpenses = useMemo(() => {
        let list = [...filteredExpenses];

        // Text search on description (case‑insensitive)
        if (searchText.trim()) {
            const lower = searchText.toLowerCase();
            list = list.filter(e => e.Description && e.Description.toLowerCase().includes(lower));
        }

        // Category filter
        if (categoryFilter) {
            const catId = Number(categoryFilter);
            if (!isNaN(catId)) {
                list = list.filter(e => Number(e.CategoryId) === catId);
            }
        }

        // User filter
        if (userFilter) {
            const userId = Number(userFilter);
            if (!isNaN(userId)) {
                list = list.filter(e => Number(e.UserId) === userId);
            }
        }

        // Sort
        list.sort((a, b) => {
            let valA, valB;
            if (sortField === 'Timestamp') {
                valA = a.Timestamp || '';
                valB = b.Timestamp || '';
            } else if (sortField === 'Amount') {
                valA = parseFloat(a.Amount) || 0;
                valB = parseFloat(b.Amount) || 0;
            } else { // Description
                valA = (a.Description || '').toLowerCase();
                valB = (b.Description || '').toLowerCase();
            }

            if (sortDirection === 'asc') {
                if (valA < valB) return -1;
                if (valA > valB) return 1;
                return 0;
            } else {
                if (valA > valB) return -1;
                if (valA < valB) return 1;
                return 0;
            }
        });

        return list;
    }, [filteredExpenses, searchText, categoryFilter, userFilter, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(processedExpenses.length / itemsPerPage);
    const safeCurrentPage = Math.min(currentPage, totalPages) || 1;
    const paginatedExpenses = processedExpenses.slice(
        (safeCurrentPage - 1) * itemsPerPage,
        safeCurrentPage * itemsPerPage
    );

    const handleSortChange = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };
    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
    };

    // Editing handlers unchanged
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
        const confirmed = window.confirm(`Delete expense #${expenseId}?`);
        if (!confirmed) return;
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

    const sortArrow = (field) => {
        if (sortField !== field) return ' ⇅';
        return sortDirection === 'asc' ? ' ↑' : ' ↓';
    };

    return (
        <div className="page">
            <h2>📋 All Expenses{rangeLabel}</h2>

            {/* Filter controls */}
            <div className="expense-filters">
                <div className="filter-group">
                    <label>Search:</label>
                    <input
                        type="text"
                        placeholder="Search description..."
                        value={searchText}
                        onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <div className="filter-group">
                    <label>Category:</label>
                    <select
                        value={categoryFilter}
                        onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="">All</option>
                        {categories.map(cat => (
                            <option key={cat.CategoryId} value={cat.CategoryId}>
                                {cat.CategoryName}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>User:</label>
                    <select
                        value={userFilter}
                        onChange={e => { setUserFilter(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="">All</option>
                        {users.map(u => (
                            <option key={u.UserId} value={u.UserId}>
                                {u.Name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Per page:</label>
                    <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <p>🔄 Loading expenses from AWS...</p>
            ) : paginatedExpenses.length > 0 ? (
                <>
                    <div className="expense-table">
                        <div className="table-header">
                            <span>ID</span>
                            <span
                                className="sortable"
                                onClick={() => handleSortChange('Timestamp')}
                            >
                                Date{sortArrow('Timestamp')}
                            </span>
                            <span
                                className="sortable"
                                onClick={() => handleSortChange('Description')}
                            >
                                Description{sortArrow('Description')}
                            </span>
                            <span>Category</span>
                            <span>User</span>
                            <span
                                className="sortable"
                                onClick={() => handleSortChange('Amount')}
                            >
                                Amount{sortArrow('Amount')}
                            </span>
                            <span>Actions</span>
                        </div>
                        {paginatedExpenses.map(expense => (
                            editingExpenseId === expense.ExpenseId ? (
                                <div key={expense.ExpenseId} className="table-row">
                                    <span>{expense.ExpenseId}</span>
                                    <span>{expense.Timestamp}</span>
                                    <input
                                        value={editForm.Description}
                                        onChange={(e) =>
                                            setEditForm({...editForm, Description: e.target.value})
                                        }
                                    />
                                    <select
                                        value={editForm.CategoryId}
                                        onChange={(e) =>
                                            setEditForm({...editForm, CategoryId: Number(e.target.value)})
                                        }
                                    >
                                        {categories.map(category => (
                                            <option key={category.CategoryId} value={category.CategoryId}>
                                                {category.CategoryName}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={editForm.UserId}
                                        onChange={(e) =>
                                            setEditForm({...editForm, UserId: Number(e.target.value)})
                                        }
                                    >
                                        {users.map(user => (
                                            <option key={user.UserId} value={user.UserId}>
                                                {user.Name}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.Amount}
                                        onChange={(e) =>
                                            setEditForm({...editForm, Amount: e.target.value})
                                        }
                                    />
                                    <span>
                                        <button onClick={handleSave}>💾 Save</button>
                                        <button onClick={handleCancel}>❌ Cancel</button>
                                    </span>
                                </div>
                            ) : (
                                <div key={expense.ExpenseId} className="table-row">
                                    <span>{expense.ExpenseId}</span>
                                    <span>{expense.Timestamp}</span>
                                    <span>{expense.Description}</span>
                                    <span>{getCategoryName(expense.CategoryId, categories)}</span>
                                    <span>{getUserName(expense.UserId, users)}</span>
                                    <span>₹{parseFloat(expense.Amount).toFixed(2)}</span>
                                    <span>
                                        <button onClick={() => handleEditClick(expense)}>✏️ Edit</button>
                                        <button onClick={() => handleDelete(expense.ExpenseId)}>🗑 Delete</button>
                                    </span>
                                </div>
                            )
                        ))}
                    </div>

                    {/* Pagination controls */}
                    <div className="pagination">
                        <button disabled={safeCurrentPage <= 1} onClick={handlePrevPage}>
                            ◀ Prev
                        </button>
                        <span> Page {safeCurrentPage} of {totalPages} </span>
                        <button disabled={safeCurrentPage >= totalPages} onClick={handleNextPage}>
                            Next ▶
                        </button>
                    </div>
                </>
            ) : (
                <p>No expenses found{rangeLabel}.</p>
            )}
        </div>
    );
}

export default ExpenseList;
