import React, { useState } from 'react';
import { categoryAPI } from '../../services/api';

function CategoryManager({ categories, loading, onRefresh }) {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const [newCategoryName, setNewCategoryName] = useState('');
    const [newDescription, setNewDescription] = useState('');

    const handleRowClick = (category) => {
        setSelectedCategory(category);
        setEditCategoryName(category.CategoryName);
        setEditDescription(category.Description || '');
    };

    const handleSave = async () => {
        try {
            await categoryAPI.updateCategory(
                selectedCategory.CategoryId,
                editCategoryName,
                editDescription
            );
            alert('Category updated successfully');
            setSelectedCategory(null);
            onRefresh();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to update category';
            alert(msg);
        }
    };

    const handleDelete = async (categoryId) => {
        const confirmed = window.confirm(`Delete category #${categoryId}?`);
        if (!confirmed) return;
        try {
            await categoryAPI.deleteCategory(categoryId);
            alert('Category deleted successfully');
            setSelectedCategory(null);
            onRefresh();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to delete category';
            alert(msg);
        }
    };

    const addCategory = async () => {
        if (!newCategoryName.trim()) {
            alert('Category name is required');
            return;
        }
        try {
            await categoryAPI.addCategory(newCategoryName, newDescription);
            alert('Category added successfully');
            setNewCategoryName('');
            setNewDescription('');
            onRefresh();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to add category';
            alert(msg);
        }
    };

    if (loading) {
        return <p>Loading categories...</p>;
    }

    return (
        <div className="page">
            <h2>🏷️ Category Manager</h2>

            <div className="expense-table">
                <div className="table-header">
                    <span>ID</span>
                    <span>Category Name</span>
                    <span>Description</span>
                </div>

                {categories.map(category => (
                    <div
                        key={category.CategoryId}
                        className="table-row"
                        onClick={() => handleRowClick(category)}
                    >
                        <span>{category.CategoryId}</span>
                        <span>{category.CategoryName}</span>
                        <span>{category.Description}</span>
                    </div>
                ))}
            </div>

            <hr />

            <h3>Add Category</h3>

            <div>
                <input
                    type="text"
                    placeholder="Category Name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                />
                <button onClick={addCategory}>Add Category</button>
            </div>

            {/* Modal for editing / deleting */}
            {selectedCategory && (
                <div className="modal-overlay" onClick={() => setSelectedCategory(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Edit Category #{selectedCategory.CategoryId}</h3>

                        <label>Category Name</label>
                        <input
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                        />

                        <label>Description</label>
                        <input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                        />

                        <div className="modal-actions">
                            <button onClick={handleSave}>💾 Save</button>
                            <button onClick={() => handleDelete(selectedCategory.CategoryId)}>🗑 Delete</button>
                            <button onClick={() => setSelectedCategory(null)}>❌ Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CategoryManager;
