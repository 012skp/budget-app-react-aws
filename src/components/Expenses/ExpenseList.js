import {getCategoryName, getUserName} from "../../utils/dataHelpers";
import { expenseAPI } from '../../services/api';
import React, { useState, useMemo } from 'react';

// Convert "2024-05-21 10:30:00" or "2024-05-21T10:30:00" into a value usable by <input type="datetime-local">
const toDateTimeLocal = (value) => {
    if (!value) return '';
    const str = String(value).replace(' ', 'T');
    // Return only the first 16 characters (YYYY-MM-DDTHH:MM)
    return str.length >= 16 ? str.slice(0, 16) : str;
};

// Convert "YYYY-MM-DDTHH:MM" (from datetime-local input) into "YYYY-MM-DD HH:MM:SS" for MySQL
const toMySqlTimestamp = (value) => {
    if (!value) return '';
    const replaced = value.replace('T', ' ');
    // If time part only has HH:MM, append seconds
    return replaced.length === 16 ? `${replaced}:00` : replaced;
};

function ExpenseList({filteredExpenses, users, categories, dateRange, loading, onRefresh, initialFilter}) {
    // Modal state
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [editForm, setEditForm] = useState({
        UserId: '',
        CategoryId: '',
        Amount: '',
        Description: '',
        Timestamp: ''
    });

    // Filter / sort / pagination state
    const initialCategoryId = initialFilter?.type === 'category' ? String(initialFilter.value) : '';
    const initialUserId = initialFilter?.type === 'user' ? String(initialFilter.value) : '';

    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(initialCategoryId);
    const [userFilter, setUserFilter] = useState(initialUserId);
    const [sortField, setSortField] = useState('Timestamp');
    const [sortDirection, setSortDirection] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Apply client‑side filter and sort
    const processedExpenses = useMemo(() => {
        let list = [...filteredExpenses];

        if (searchText.trim()) {
            const lower = searchText.toLowerCase();
            list = list.filter(e => e.Description && e.Description.toLowerCase().includes(lower));
        }

        if (categoryFilter) {
            const catId = Number(categoryFilter);
            if (!isNaN(catId)) {
                list = list.filter(e => Number(e.CategoryId) === catId);
            }
        }

        if (userFilter) {
            const userId = Number(userFilter);
            if (!isNaN(userId)) {
                list = list.filter(e => Number(e.UserId) === userId);
            }
        }

        list.sort((a, b) => {
            let valA, valB;
            if (sortField === 'Timestamp') {
                valA = a.Timestamp || '';
                valB = b.Timestamp || '';
            } else if (sortField === 'Amount') {
                valA = parseFloat(a.Amount) || 0;
                valB = parseFloat(b.Amount) || 0;
            } else {
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

    // Row click → open modal
    const handleRowClick = (expense) => {
        setSelectedExpense(expense);
        setEditForm({
            UserId: expense.UserId,
            CategoryId: expense.CategoryId,
            Amount: expense.Amount,
            Description: expense.Description,
            Timestamp: toDateTimeLocal(expense.Timestamp)
        });
    };

    // Modal actions
    const handleSave = async () => {
        try {
            await expenseAPI.updateExpense(
                selectedExpense.ExpenseId,
                editForm.UserId,
                editForm.CategoryId,
                editForm.Amount,
                editForm.Description,
                toMySqlTimestamp(editForm.Timestamp)
            );
            alert('Expense updated successfully');
            setSelectedExpense(null);
            if (onRefresh) {
                await onRefresh();
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to update expense';
            alert(msg);
        }
    };

    const handleDelete = async (expenseId) => {
        const confirmed = window.confirm(`Delete expense #${expenseId}?`);
        if (!confirmed) return;
        try {
            await expenseAPI.deleteExpense(expenseId);
            alert('Expense deleted successfully');
            setSelectedExpense(null);
            if (onRefresh) {
                await onRefresh();
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to delete expense';
            alert(msg);
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
                    <div className="expense-list">
                        {paginatedExpenses.map(expense => (
                            <div
                                key={expense.ExpenseId}
                                className="expense-item"
                                onClick={() => handleRowClick(expense)}
                            >
                                <div className="expense-info">
                                    <span className="expense-id">#{expense.ExpenseId}</span>
                                    <span className="expense-description">{expense.Description}</span>
                                    <span className="expense-category">{getCategoryName(expense.CategoryId, categories)}</span>
                                </div>
                                <div className="expense-details">
                                    <span className="expense-amount">₹{parseFloat(expense.Amount).toFixed(2)}</span>
                                    <span className="expense-user">{getUserName(expense.UserId, users)}</span>
                                    <span className="expense-date">{expense.Timestamp}</span>
                                </div>
                            </div>
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

            {/* Modal for editing / deleting */}
            {selectedExpense && (
                <div className="modal-overlay" onClick={() => setSelectedExpense(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Edit Expense #{selectedExpense.ExpenseId}</h3>

                        <label>Date &amp; Time</label>
                        <input
                            type="datetime-local"
                            value={editForm.Timestamp}
                            onChange={(e) =>
                                setEditForm({...editForm, Timestamp: e.target.value})
                            }
                        />

                        <label>Description</label>
                        <input
                            value={editForm.Description}
                            onChange={(e) =>
                                setEditForm({...editForm, Description: e.target.value})
                            }
                        />

                        <label>Category</label>
                        <select
                            value={editForm.CategoryId}
                            onChange={(e) =>
                                setEditForm({...editForm, CategoryId: Number(e.target.value)})
                            }
                        >
                            {categories.map(cat => (
                                <option key={cat.CategoryId} value={cat.CategoryId}>
                                    {cat.CategoryName}
                                </option>
                            ))}
                        </select>

                        <label>User</label>
                        <select
                            value={editForm.UserId}
                            onChange={(e) =>
                                setEditForm({...editForm, UserId: Number(e.target.value)})
                            }
                        >
                            {users.map(u => (
                                <option key={u.UserId} value={u.UserId}>
                                    {u.Name}
                                </option>
                            ))}
                        </select>

                        <label>Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            value={editForm.Amount}
                            onChange={(e) =>
                                setEditForm({...editForm, Amount: e.target.value})
                            }
                        />

                        <div className="modal-actions">
                            <button onClick={handleSave}>💾 Save</button>
                            <button onClick={() => handleDelete(selectedExpense.ExpenseId)}>🗑 Delete</button>
                            <button onClick={() => setSelectedExpense(null)}>❌ Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExpenseList;
