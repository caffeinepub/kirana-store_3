import { ProductCategory } from "../hooks/useQueries";

type CategoryFilter = "all" | ProductCategory;

interface CategoryNavProps {
  selected: CategoryFilter;
  onSelect: (cat: CategoryFilter) => void;
}

const CATEGORIES: {
  key: CategoryFilter;
  label: string;
  emoji: string;
  ocid: string;
}[] = [
  { key: "all", label: "All", emoji: "🛒", ocid: "nav.all_tab" },
  {
    key: ProductCategory.groceries,
    label: "Groceries",
    emoji: "🍚",
    ocid: "nav.groceries_tab",
  },
  {
    key: ProductCategory.fruits,
    label: "Fruits",
    emoji: "🍎",
    ocid: "nav.fruits_tab",
  },
  {
    key: ProductCategory.vegetables,
    label: "Vegetables",
    emoji: "🥦",
    ocid: "nav.vegetables_tab",
  },
  {
    key: ProductCategory.dairy,
    label: "Dairy",
    emoji: "🥛",
    ocid: "nav.dairy_tab",
  },
  {
    key: ProductCategory.snacks,
    label: "Snacks",
    emoji: "🍪",
    ocid: "nav.snacks_tab",
  },
  {
    key: ProductCategory.beverages,
    label: "Beverages",
    emoji: "🥤",
    ocid: "nav.beverages_tab",
  },
  {
    key: ProductCategory.personalCare,
    label: "Personal Care",
    emoji: "🧴",
    ocid: "nav.personalcare_tab",
  },
  {
    key: ProductCategory.household,
    label: "Household",
    emoji: "🏠",
    ocid: "nav.household_tab",
  },
];

export function CategoryNav({ selected, onSelect }: CategoryNavProps) {
  return (
    <div className="bg-card border-b border-border sticky top-16 z-30">
      <div className="max-w-6xl mx-auto px-4">
        <div
          className="flex gap-2 overflow-x-auto py-3 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelect(cat.key)}
              data-ocid={cat.ocid}
              className={`category-pill flex-shrink-0 ${
                selected === cat.key
                  ? "category-pill-active"
                  : "category-pill-inactive"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
