import React, { useState } from 'react';
import { userAPI } from '../../services/api';
import Modal from '../Common/Modal';
import FormField from '../Common/FormField';

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
                <FormField label="Name">
                    <input
                        className="form-input"
                        placeholder="User Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
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
                <button className="btn-primary" onClick={addUser}>Add User</button>
            </div>

            {selectedUser && (
                <Modal onClose={() => setSelectedUser(null)}>
                    <h3>Edit User #{selectedUser.UserId}</h3>

                    <FormField label="Name">
                        <input
                            className="form-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
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
                        <button className="btn-danger" onClick={() => handleDelete(selectedUser.UserId)}>🗑 Delete</button>
                        <button className="btn-secondary" onClick={() => setSelectedUser(null)}>❌ Cancel</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default UserManager;
