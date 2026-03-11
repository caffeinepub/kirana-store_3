/**
 * Maps product names to their generated image paths.
 * Images are a frontend concern — not stored in the backend.
 */
export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "Basmati Rice": "/assets/generated/product-basmati-rice.dim_400x400.jpg",
  Atta: "/assets/generated/product-atta.dim_400x400.jpg",
  "Toor Dal": "/assets/generated/product-toor-dal.dim_400x400.jpg",
  "Mustard Oil": "/assets/generated/product-mustard-oil.dim_400x400.jpg",
  Sugar: "/assets/generated/product-sugar.dim_400x400.jpg",
  Salt: "/assets/generated/product-salt.dim_400x400.jpg",
  "Maggi Noodles": "/assets/generated/product-maggi.dim_400x400.jpg",
  "Britannia Bread": "/assets/generated/product-bread.dim_400x400.jpg",
  Banana: "/assets/generated/product-banana.dim_400x400.jpg",
  Apple: "/assets/generated/product-apple.dim_400x400.jpg",
  Mango: "/assets/generated/product-mango.dim_400x400.jpg",
  Watermelon: "/assets/generated/product-watermelon.dim_400x400.jpg",
  Grapes: "/assets/generated/product-grapes.dim_400x400.jpg",
  Tomato: "/assets/generated/product-tomato.dim_400x400.jpg",
  Potato: "/assets/generated/product-potato.dim_400x400.jpg",
  Onion: "/assets/generated/product-onion.dim_400x400.jpg",
  Spinach: "/assets/generated/product-spinach.dim_400x400.jpg",
  Carrot: "/assets/generated/product-carrot.dim_400x400.jpg",
  Capsicum: "/assets/generated/product-capsicum.dim_400x400.jpg",
  "Amul Milk": "/assets/generated/product-milk.dim_400x400.jpg",
  "Amul Butter": "/assets/generated/product-butter.dim_400x400.jpg",
  Paneer: "/assets/generated/product-paneer.dim_400x400.jpg",
  "Amul Curd": "/assets/generated/product-curd.dim_400x400.jpg",
  "Cheese Slice": "/assets/generated/product-cheese-slice.dim_400x400.jpg",
  "Parle-G": "/assets/generated/product-parle-g.dim_400x400.jpg",
  "Lays Chips": "/assets/generated/product-chips.dim_400x400.jpg",
  "Good Day Biscuits": "/assets/generated/product-good-day.dim_400x400.jpg",
  Kurkure: "/assets/generated/product-kurkure.dim_400x400.jpg",
  "Hide & Seek": "/assets/generated/product-good-day.dim_400x400.jpg",
  "Real Juice": "/assets/generated/product-juice.dim_400x400.jpg",
  "Coca-Cola": "/assets/generated/product-cola.dim_400x400.jpg",
  Frooti: "/assets/generated/product-frooti.dim_400x400.jpg",
  "Bisleri Water": "/assets/generated/product-water.dim_400x400.jpg",
  Horlicks: "/assets/generated/product-horlicks.dim_400x400.jpg",
  "Colgate Toothpaste": "/assets/generated/product-toothpaste.dim_400x400.jpg",
  "Lifebuoy Soap": "/assets/generated/product-soap.dim_400x400.jpg",
  "Dove Shampoo": "/assets/generated/product-shampoo.dim_400x400.jpg",
  "Dettol Sanitizer": "/assets/generated/product-sanitizer.dim_400x400.jpg",
  "Surf Excel": "/assets/generated/product-detergent.dim_400x400.jpg",
  "Harpic Toilet Cleaner":
    "/assets/generated/product-toilet-cleaner.dim_400x400.jpg",
  "Vim Dishwash Bar": "/assets/generated/product-dishwash-bar.dim_400x400.jpg",
  "Colin Glass Cleaner":
    "/assets/generated/product-glass-cleaner.dim_400x400.jpg",
  "Paracetamol 500mg": "/assets/generated/product-paracetamol.dim_400x400.jpg",
  Crocin: "/assets/generated/product-crocin.dim_400x400.jpg",
  Disprin: "/assets/generated/product-disprin.dim_400x400.jpg",
  "ORS Sachet": "/assets/generated/product-ors-sachet.dim_400x400.jpg",
  "Digene Antacid": "/assets/generated/product-digene.dim_400x400.jpg",
  "Band-Aid": "/assets/generated/product-bandaid.dim_400x400.jpg",
  "Dettol Antiseptic":
    "/assets/generated/product-dettol-antiseptic.dim_400x400.jpg",
  "Vicks VapoRub": "/assets/generated/product-vicks-vaporub.dim_400x400.jpg",
};

/**
 * Returns the image path for a product name, or null if not found.
 */
export function getProductImage(name: string): string | null {
  return PRODUCT_IMAGE_MAP[name] ?? null;
}
