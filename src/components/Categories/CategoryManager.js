import React, { useState } from 'react';
import { categoryAPI } from '../../services/api';
import Modal from '../Common/Modal';
import FormField from '../Common/FormField';

function CategoryManager({ categories, loading, onRefresh, onCategoryChange }) {
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
            onCategoryChange?.();
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
            onCategoryChange?.();
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
            onCategoryChange?.();
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

            <div className="form-card">
                <h3>Add Category</h3>
                <FormField label="Category Name">
                    <input
                        className="form-input"
                        placeholder="Category Name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                </FormField>
                <FormField label="Description">
                    <input
                        className="form-input"
                        placeholder="Description"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                    />
                </FormField>
                <button className="btn-primary" onClick={addCategory}>Add Category</button>
            </div>

            {selectedCategory && (
                <Modal onClose={() => setSelectedCategory(null)}>
                    <h3>Edit Category #{selectedCategory.CategoryId}</h3>

                    <FormField label="Category Name">
                        <input
                            className="form-input"
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                        />
                    </FormField>

                    <FormField label="Description">
                        <input
                            className="form-input"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                        />
                    </FormField>

                    <div className="modal-actions">
                        <button className="btn-primary" onClick={handleSave}>💾 Save</button>
                        <button className="btn-danger" onClick={() => handleDelete(selectedCategory.CategoryId)}>🗑 Delete</button>
                        <button className="btn-secondary" onClick={() => setSelectedCategory(null)}>❌ Cancel</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default CategoryManager;
