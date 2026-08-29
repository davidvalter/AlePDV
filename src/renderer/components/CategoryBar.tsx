export function CategoryBar({
    categories,
    selected,
    onSelect,
}: {
    categories: string[];
    selected: string | null;
    onSelect: (cat: string | null) => void;
}) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2">
            <button
                onClick={() => onSelect(null)}
                className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors ${selected === null
                        ? 'bg-olive-500 text-cream-50'
                        : 'bg-cream-100 text-wood-600 hover:bg-cream-200'
                    }`}
            >
                Todos
            </button>
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onSelect(cat)}
                    className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors ${selected === cat
                            ? 'bg-olive-500 text-cream-50'
                            : 'bg-cream-100 text-wood-600 hover:bg-cream-200'
                        }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}