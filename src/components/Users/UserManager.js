import React, { useState } from 'react';
import { userAPI } from '../../services/api';

function UserManager({ users, loading, onRefresh }) {
    const [editingUserId, setEditingUserId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');

    const startEdit = (user) => {
        setEditingUserId(user.UserId);
        setEditName(user.Name);
        setEditDescription(user.Description || '');
    };

    const cancelEdit = () => {
        setEditingUserId(null);
        setEditName('');
        setEditDescription('');
    };

    const saveEdit = async () => {
        try {
            await userAPI.updateUser(
                editingUserId,
                editName,
                editDescription
            );

            alert('User updated successfully');

            cancelEdit();
            onRefresh();

        } catch (error) {
            console.error(error);
            alert('Failed to update user');
        }
    };

    const addUser = async () => {
        if (!newName.trim()) {
            alert('Name is required');
            return;
        }

        try {
            await userAPI.addUser(
                newName,
                newDescription
            );

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
                    <span>Action</span>
                </div>


                {users.map(user => (
                    <div key={user.UserId} className="table-row">

                        <span>{user.UserId}</span>


                        <span>
                            {editingUserId === user.UserId ? (
                                <input
                                    value={editName}
                                    onChange={(e) =>
                                        setEditName(e.target.value)
                                    }
                                />
                            ) : (
                                user.Name
                            )}
                        </span>

                        <span>
                            {editingUserId === user.UserId ? (
                                <input
                                    value={editDescription}
                                    onChange={(e) =>
                                        setEditDescription(e.target.value)
                                    }
                                />
                            ) : (
                                user.Description
                            )}

                        </span>

                        <span>
                            {editingUserId === user.UserId ? (
                                <>
                                    <button onClick={saveEdit}>
                                        Save
                                    </button>

                                    <button onClick={cancelEdit}>
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => startEdit(user)}
                                >
                                    Edit
                                </button>
                            )}
                        </span>


                    </div>
                ))}

            </div>

            <hr />

            <h3>Add User</h3>

            <div>
                <input
                    placeholder="User Name"
                    value={newName}
                    onChange={(e) =>
                        setNewName(e.target.value)
                    }
                />

                <input
                    placeholder="Description"
                    value={newDescription}
                    onChange={(e) =>
                        setNewDescription(e.target.value)
                    }
                />

                <button onClick={addUser}>
                    Add User
                </button>
            </div>
        </div>
    );
}

export default UserManager;