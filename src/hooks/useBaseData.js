import { useState, useEffect } from 'react';
import { userAPI, categoryAPI } from '../services/api';

export function useBaseData() {
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);

    const refreshUsers = async () => {
        try {
            const res = await userAPI.getUsers();
            setUsers(res.data.users || []);
        } catch (error) {
            console.error('❌ Failed to refresh users:', error);
        }
    };

    const refreshCategories = async () => {
        try {
            const res = await categoryAPI.getCategories();
            setCategories(res.data.categories || []);
        } catch (error) {
            console.error('❌ Failed to refresh categories:', error);
        }
    };

    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                const [usersRes, categoriesRes] = await Promise.all([
                    userAPI.getUsers(),
                    categoryAPI.getCategories()
                ]);

                setUsers(usersRes.data.users || []);
                setCategories(categoriesRes.data.categories || []);
            } catch (error) {
                console.error('❌ Base data fetch error:', error);

                setUsers([
                    { user_id: '1', name: 'John Doe', description: 'Primary user' },
                    { user_id: '2', name: 'Jane Smith', description: 'Secondary user' }
                ]);

                setCategories([
                    { category_id: '1', category_name: 'Food', description: 'Food and groceries' },
                    { category_id: '2', category_name: 'Transport', description: 'Transportation costs' }
                ]);
            }
        };

        fetchBaseData();
    }, []);

    return { users, categories, refreshUsers, refreshCategories };
}
