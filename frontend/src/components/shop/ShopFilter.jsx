import React, { useEffect, useState } from 'react';
import { CategoryService } from '../../services/modules/products/categoryService';

export default function ShopFilter({ selectedCategory, onCategoryChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await CategoryService.getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section className="mb-8">
      <h2 className="font-Alata text-3xl text-[#9e211f]">{selectedCategory}</h2>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-[#faf998] p-4 rounded-lg cursor-pointer"
              onClick={() => onCategoryChange(category.id)}
            >
              {category.name || 'Unnamed Category'}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="border p-2 rounded-md cursor-pointer">Tìm kiếm</div>
          <div className="p-2 cursor-pointer">Bộ lọc</div>
        </div>
      </div>
    </section>
  );
}
