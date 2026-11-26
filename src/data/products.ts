export type Product = {
  id: number; slug: string; name: string; price: number; oldPrice?: number;
  category: "woman" | "man" | "accessories" | "bags" | "footwear";
  tag?: "best" | "new" | "sale"; image: string; description: string; sizes: string[];
  /* Tên / mô tả tiếng Anh (v6): hiện khi ngôn ngữ là EN, thiếu thì rơi
     về name / description (xem src/lib/i18n productName/productDescription). */
  nameEn?: string; descriptionEn?: string;
  // Tồn kho theo size (chỉ có khi lấy từ API/CSDL; hàng mẫu fallback không có).
  sizeStocks?: { size: string; stock: number }[];
};
export const products: Product[] = [
  { id: 1, slug: "guide-pack-cap", name: "Guide Pack Cap", price: 50000, category: "accessories", tag: "best", image: "/images/products/guide-pack-cap.jpg", description: "Mũ lưỡi trai tối giản, chất liệu cotton thoáng mát, phù hợp mọi outfit.", nameEn: "Guide Pack Cap", descriptionEn: "Minimalist baseball cap in breathable cotton — fits every outfit.", sizes: ["Free"] },
  { id: 2, slug: "blue-raincoat", name: "Blue Raincoat", price: 430000, category: "woman", tag: "best", image: "/images/products/blue-raincoat.jpg", description: "Áo khoác dài tông xanh pastel, form rộng thanh lịch cho mùa xuân.", nameEn: "Blue Raincoat", descriptionEn: "Long pastel-blue coat with a relaxed, elegant cut for spring.", sizes: ["S","M","L"] },
  { id: 3, slug: "cotton-jacket", name: "Cotton Jacket", price: 100000, category: "woman", tag: "best", image: "/images/products/cotton-jacket.jpg", description: "Áo jacket cotton mềm, màu be dễ phối đồ, điểm nhấn cho set đồ tối giản.", nameEn: "Cotton Jacket", descriptionEn: "Soft beige cotton jacket, easy to style — the finishing touch for a minimalist outfit.", sizes: ["S","M","L","XL"] },
  { id: 4, slug: "crewneck-blouse", name: "Crewneck Blouse", price: 215000, category: "woman", tag: "best", image: "/images/products/crewneck-blouse.jpg", description: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.", nameEn: "Crewneck Blouse", descriptionEn: "Classic crewneck blouse with a clean, effortless silhouette.", sizes: ["S","M","L"] },
  { id: 5, slug: "eather-trainers", name: "Eather Trainers", price: 310000, category: "footwear", tag: "new", image: "/images/products/eather-trainers.jpg", description: "Giày trainers màu nude, đế êm, phong cách tối giản Hàn Quốc.", nameEn: "Eather Trainers", descriptionEn: "Nude trainers with a cushioned sole, Korean minimalist style.", sizes: ["36","37","38","39","40"] },
  { id: 6, slug: "cotton-t-shirt", name: "Cotton T-shirt", price: 250000, oldPrice: 340000, category: "woman", tag: "sale", image: "/images/products/cotton-t-shirt.jpg", description: "Áo thun cotton màu cam đào, sale 26%, item must-have mùa hè.", nameEn: "Cotton T-shirt", descriptionEn: "Peach cotton T-shirt, 26% off — a summer must-have.", sizes: ["S","M","L","XL"] },
  { id: 7, slug: "azure-tote", name: "Azure Tote", price: 200000, oldPrice: 250000, category: "bags", tag: "sale", image: "/images/products/azure-tote.jpg", description: "Túi tote đen quai vàng, sale 20%, đựng vừa laptop 14 inch.", nameEn: "Azure Tote", descriptionEn: "Black tote with gold handles, 20% off — fits a 14-inch laptop.", sizes: ["Free"] },
  { id: 8, slug: "classic-topper", name: "Classic Topper", price: 490000, category: "man", tag: "new", image: "/images/products/classic-topper.jpg", description: "Áo khoác dáng dài màu đen cổ điển, sang trọng và dễ phối.", nameEn: "Classic Topper", descriptionEn: "Classic long black coat, timeless and easy to style.", sizes: ["M","L","XL"] },
];
