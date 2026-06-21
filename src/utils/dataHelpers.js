export function getUserName(userId, users) {
    const user = users.find(u => u.UserId === userId);
    return user ? user.Name : `User ${userId}`;
}

export function getCategoryName(categoryId, categories) {
    const category = categories.find(c => c.CategoryId === categoryId);
    return category
        ? category.CategoryName
        : `Category ${categoryId}`;
}