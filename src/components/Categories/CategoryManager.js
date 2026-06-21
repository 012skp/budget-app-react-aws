import React, { useState } from 'react';
import { categoryAPI } from '../../services/api';

function CategoryManager({ categories, loading, onRefresh }) {

    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const [newCategoryName, setNewCategoryName] = useState('');
    const [newDescription, setNewDescription] = useState('');

    const startEdit = (category) => {
        setEditingCategoryId(category.CategoryId);
        setEditCategoryName(category.CategoryName);
        setEditDescription(category.Description || '');
    };

    const cancelEdit = () => {
        setEditingCategoryId(null);
        setEditCategoryName('');
        setEditDescription('');
    };

    const saveEdit = async () => {
        try {

            await categoryAPI.updateCategory(
                editingCategoryId,
                editCategoryName,
                editDescription
            );

            alert('Category updated successfully');

            cancelEdit();

            onRefresh();

        } catch (error) {

            console.error(error);

            alert('Failed to update category');
        }
    };

    const addCategory = async () => {

        if (!newCategoryName.trim()) {
            alert('Category name is required');
            return;
        }

        try {

            await categoryAPI.addCategory(
                newCategoryName,
                newDescription
            );

            alert('Category added successfully');

            setNewCategoryName('');
            setNewDescription('');

            onRefresh();

        } catch (error) {

            console.error(error);

            alert('Failed to add category');
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
                    <span>Actions</span>
                </div>

                {categories.map(category => (

                    <div
                        key={category.CategoryId}
                        className="table-row"
                    >

                        <span>
                            {category.CategoryId}
                        </span>

                        <span>
                            {editingCategoryId === category.CategoryId ? (
                                <input
                                    value={editCategoryName}
                                    onChange={(e) =>
                                        setEditCategoryName(
                                            e.target.value
                                        )
                                    }
                                />
                            ) : (
                                category.CategoryName
                            )}
                        </span>

                        <span>
                            {editingCategoryId === category.CategoryId ? (
                                <input
                                    value={editDescription}
                                    onChange={(e) =>
                                        setEditDescription(
                                            e.target.value
                                        )
                                    }
                                />
                            ) : (
                                category.Description
                            )}
                        </span>

                        <span>

                            {editingCategoryId === category.CategoryId ? (
                                <>
                                    <button
                                        onClick={saveEdit}
                                    >
                                        Save
                                    </button>

                                    <button
                                        onClick={cancelEdit}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() =>
                                        startEdit(category)
                                    }
                                >
                                    Edit
                                </button>
                            )}

                        </span>

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
                    onChange={(e) =>
                        setNewCategoryName(
                            e.target.value
                        )
                    }
                />

                <input
                    type="text"
                    placeholder="Description"
                    value={newDescription}
                    onChange={(e) =>
                        setNewDescription(
                            e.target.value
                        )
                    }
                />

                <button
                    onClick={addCategory}
                >
                    Add Category
                </button>

            </div>

        </div>
    );
}

export default CategoryManager;