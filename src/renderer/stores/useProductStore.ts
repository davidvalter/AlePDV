import { create } from 'zustand';

interface ProductState {
    products: any[];
    categories: string[];
    selectedCategory: string | null;
    loading: boolean;
    loadProducts: () => Promise<void>;
    selectCategory: (cat: string | null) => void;
    filtered: () => any[];
}

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    categories: [],
    selectedCategory: null,
    loading: false,

    loadProducts: async () => {
        set({ loading: true });
        const [prodRes, catRes] = await Promise.all([
            window.pdv.getProducts(),
            window.pdv.getCategories(),
        ]);
        set({
            products: prodRes.success ? prodRes.data : [],
            categories: catRes.success ? catRes.data : [],
            loading: false,
        });
    },

    selectCategory: (cat) => set({ selectedCategory: cat }),

    filtered: () => {
        const { products, selectedCategory } = get();
        if (!selectedCategory) return products;
        return products.filter((p) => p.Categoria === selectedCategory);
    },
}));