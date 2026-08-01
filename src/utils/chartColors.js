export const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FF6F91",
    "#00C2D1"
];

export const CATEGORY_COLOR_MAP = {
    medical: "#2ecc71",
    healthcare: "#2ecc71",
    health: "#2ecc71",
    medicine: "#2ecc71",
    doctor: "#2ecc71",
    hospital: "#2ecc71",
    food: "#f39c12",
    groceries: "#f39c12",
    dining: "#f39c12",
    restaurant: "#f39c12",
    transport: "#3498db",
    travel: "#3498db",
    fuel: "#3498db",
    gas: "#3498db",
    rent: "#9b59b6",
    housing: "#9b59b6",
    utilities: "#9b59b6",
    electricity: "#9b59b6",
    entertainment: "#e91e63",
    movies: "#e91e63",
    fun: "#e91e63",
    shopping: "#ff5722",
    clothing: "#ff5722",
    retail: "#ff5722",
    education: "#00bcd4",
    school: "#00bcd4",
    tuition: "#00bcd4",
    salary: "#95a5a6",
    income: "#95a5a6",
    other: "#95a5a6"
};

export const getCategoryColor = (name, idx) => {
    if (!name) return COLORS[idx % COLORS.length];
    const key = name.trim().toLowerCase();
    if (CATEGORY_COLOR_MAP[key]) return CATEGORY_COLOR_MAP[key];
    return COLORS[idx % COLORS.length];
};
