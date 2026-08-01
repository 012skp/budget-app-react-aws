import React, { useState } from 'react';
import { userAPI } from '../../services/api';

function UserManager({ users, loading, onRefresh, onUserChange }) {
    const [selectedUser, setSelectedUser] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');

    const handleRowClick = (user) => {
        setSelectedUser(user);
        setEditName(user.Name);
        setEditDescription(user.Description || '');
    };

    const handleSave = async () => {
        try {
            await userAPI.updateUser(
                selectedUser.UserId,
                editName,
                editDescription
            );
            alert('User updated successfully');
            setSelectedUser(null);
            onRefresh();
            onUserChange?.();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to update user';
            alert(msg);
        }
    };

    const handleDelete = async (userId) => {
        const confirmed = window.confirm(`Delete user #${userId}?`);
        if (!confirmed) return;
        try {
            const response = await userAPI.deleteUser(userId);
            const data = response.data;
            const deletedExp = data.deleted_expenses || 0;
            alert(
                `User deleted successfully. ${deletedExp} associated expense(s) were also deleted.`
            );
            setSelectedUser(null);
            onRefresh();
            onUserChange?.();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to delete user';
            alert(msg);
        }
    };

    const addUser = async () => {
        if (!newName.trim()) {
            alert('Name is required');
            return;
        }
        try {
            await userAPI.addUser(newName, newDescription);
            alert('User added successfully');
            setNewName('');
            setNewDescription('');
            onRefresh();
            onUserChange?.();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to add user';
            alert(msg);
        }
    };

    if (loading) {
        return <p>Loading users...</p>;
    }

    return (
        <div className="page">
            <h2>👥 User Manager</h2>

            <div className="expense-table">
                <div className="table-header">
                    <span>User Id</span>
                    <span>Name</span>
                    <span>Description</span>
                </div>

                {users.map(user => (
                    <div
                        key={user.UserId}
                        className="table-row"
                        onClick={() => handleRowClick(user)}
                    >
                        <span>{user.UserId}</span>
                        <span>{user.Name}</span>
                        <span>{user.Description}</span>
                    </div>
                ))}
            </div>

            <hr />

            <div className="form-card">
                <h3>Add User</h3>
                <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                        className="form-input"
                        placeholder="User Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Description</label>
                    <input
                        className="form-input"
                        placeholder="Description"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={addUser}>Add User</button>
            </div>

            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Edit User #{selectedUser.UserId}</h3>

                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input
                                className="form-input"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <input
                                className="form-input"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn-primary" onClick={handleSave}>💾 Save</button>
                            <button className="btn-danger" onClick={() => handleDelete(selectedUser.UserId)}>🗑 Delete</button>
                            <button className="btn-secondary" onClick={() => setSelectedUser(null)}>❌ Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserManager;
