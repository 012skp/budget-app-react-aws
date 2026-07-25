import React, { useState } from 'react';
import { userAPI } from '../../services/api';

function UserManager({ users, loading, onRefresh }) {
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
        } catch (error) {
            console.error(error);
            alert('Failed to update user');
        }
    };

    const handleDelete = async (userId) => {
        const confirmed = window.confirm(`Delete user #${userId}?`);
        if (!confirmed) return;
        try {
            await userAPI.deleteUser(userId);
            alert('User deleted successfully');
            setSelectedUser(null);
            onRefresh();
        } catch (error) {
            console.error(error);
            alert('Failed to delete user');
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
        } catch (error) {
            console.error(error);
            alert('Failed to add user');
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

            <h3>Add User</h3>

            <div>
                <input
                    placeholder="User Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                />
                <input
                    placeholder="Description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                />
                <button onClick={addUser}>Add User</button>
            </div>

            {/* Modal for editing / deleting */}
            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Edit User #{selectedUser.UserId}</h3>

                        <label>Name</label>
                        <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                        />

                        <label>Description</label>
                        <input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                        />

                        <div className="modal-actions">
                            <button onClick={handleSave}>💾 Save</button>
                            <button onClick={() => handleDelete(selectedUser.UserId)}>🗑 Delete</button>
                            <button onClick={() => setSelectedUser(null)}>❌ Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserManager;
