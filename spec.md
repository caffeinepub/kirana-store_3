# Kirana Store

## Current State
Full-stack kirana store with 8 categories (Groceries, Fruits, Vegetables, Dairy, Snacks, Beverages, Personal Care, Household), 42 products with images, admin panel with product management, order management, and a `seedProducts()` backend function. The "Seed Products" button in the admin panel was only visible when the product list was empty.

## Requested Changes (Diff)

### Add
- Idempotent `seedProducts()` backend function that skips products already seeded (checks by name before inserting)
- Additional products in the seed list: Amul Curd, Cheese Slice, Kurkure, Hide & Seek, Frooti, Bisleri Water, Horlicks, Dove Shampoo, Dettol Sanitizer, Vim Dishwash Bar, Colin Glass Cleaner (total 42 products)

### Modify
- "Seed Products" button in AdminProductsTab is now always visible (not hidden after products exist)

### Remove
- Condition that hid the Seed Products button when product list was non-empty

## Implementation Plan
1. Regenerate Motoko backend with idempotent `seedProducts()` that checks existing product names before adding
2. Frontend: seed button is already updated to always show; validate and build
