export interface Category {
    name: string;
    icon: string;
}

const DEFAULT_CATEGORIES: Category[] = [
    { name: "Vivienda", icon: "🏠" },
    { name: "Comida", icon: "🥗" },
    { name: "Transporte", icon: "🚌" },
    { name: "Entretenimiento", icon: "🎮" },
    { name: "Salud", icon: "🏥" },
    { name: "Educación", icon: "🎓" },
    { name: "Servicios", icon: "💸" },
    { name: "Seguros", icon: "🛡" },
    { name: "Otros", icon: "🧩" },
];

export const categoriesState = $state({
    items: [] as Category[]
});

export function loadCategories() {
    if (typeof localStorage !== "undefined") {
        const stored = localStorage.getItem("lumina_custom_categories");
        if (stored) {
            try {
                categoriesState.items = JSON.parse(stored);
                return;
            } catch (e) {
                console.error("Error parsing categories", e);
            }
        }
    }
    categoriesState.items = [...DEFAULT_CATEGORIES];
}

export function saveCategories() {
    if (typeof localStorage !== "undefined") {
        localStorage.setItem("lumina_custom_categories", JSON.stringify(categoriesState.items));
    }
}

export function addCategory(name: string, icon: string) {
    if (!name.trim()) return;
    if (categoriesState.items.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
        return;
    }
    categoriesState.items.push({ name: name.trim(), icon });
    saveCategories();
}

export function removeCategory(name: string) {
    categoriesState.items = categoriesState.items.filter(c => c.name !== name);
    saveCategories();
}

export function updateCategory(oldName: string, newName: string, icon: string) {
    if (!newName.trim()) return;
    const items = [...categoriesState.items];
    const idx = items.findIndex(c => c.name === oldName);
    if (idx !== -1) {
        items[idx] = { name: newName.trim(), icon };
        categoriesState.items = items;
        saveCategories();
    }
}

export function moveCategory(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const items = [...categoriesState.items];
    const [movedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);
    categoriesState.items = items;
    saveCategories();
}

// Load categories on module initialization
if (typeof localStorage !== "undefined") {
    loadCategories();
}
