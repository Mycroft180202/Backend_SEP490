import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch } from 'react-icons/fa';
import AddProductForm from './AddProductForm';

const ProductManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const [products, setProducts] = useState([
    { id: 1, name: 'Đèn gốm sứ thủ công', category: 'Đồ gốm', price: 450000, stock: 45, status: 'Còn hàng', sales: 156, image: '/images/products/lamp.jpg' },
    { id: 2, name: 'Bình hoa gốm Bát Tràng', category: 'Đồ gốm', price: 320000, stock: 32, status: 'Còn hàng', sales: 142, image: '/images/products/vase.jpg' },
    { id: 3, name: 'Tượng gỗ phong thủy', category: 'Đồ gỗ', price: 850000, stock: 18, status: 'Còn hàng', sales: 98, image: '/images/products/statue.jpg' },
    { id: 4, name: 'Khay trà gốm sứ', category: 'Đồ gốm', price: 280000, stock: 67, status: 'Còn hàng', sales: 234, image: '/images/products/tray.jpg' },
    { id: 5, name: 'Lọ hoa gốm thủ công', category: 'Đồ gốm', price: 380000, stock: 23, status: 'Còn hàng', sales: 87, image: '/images/products/jar.jpg' },
    { id: 6, name: 'Tranh gỗ chạm khắc', category: 'Đồ gỗ', price: 1200000, stock: 8, status: 'Còn hàng', sales: 45, image: '/images/products/painting.jpg' },
    { id: 7, name: 'Bộ ấm trà gốm', category: 'Đồ gốm', price: 650000, stock: 15, status: 'Còn hàng', sales: 123, image: '/images/products/teapot.jpg' },
    { id: 8, name: 'Hộp trang sức gỗ', category: 'Đồ gỗ', price: 420000, stock: 0, status: 'Hết hàng', sales: 67, image: '/images/products/box.jpg' },
    { id: 9, name: 'Chén gốm hoa văn', category: 'Đồ gốm', price: 180000, stock: 89, status: 'Còn hàng', sales: 198, image: '/images/products/cup.jpg' },
    { id: 10, name: 'Tượng Phật gỗ', category: 'Đồ gỗ', price: 2500000, stock: 5, status: 'Còn hàng', sales: 23, image: '/images/products/buddha.jpg' },
    { id: 11, name: 'Bát gốm vẽ tay', category: 'Đồ gốm', price: 250000, stock: 42, status: 'Còn hàng', sales: 176, image: '/images/products/bowl.jpg' },
    { id: 12, name: 'Đĩa gốm sứ', category: 'Đồ gốm', price: 150000, stock: 78, status: 'Còn hàng', sales: 289, image: '/images/products/plate.jpg' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusColor = (status) => {
    return status === 'Còn hàng' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchStatus = filterStatus === 'all' || product.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Handle add product
  const handleAddProduct = (formData) => {
    // Here you would typically make an API call to submit the product
    console.log('Product data to submit:', formData);
    
    // For now, let's just show a success message and close the form
    // In production, you would:
    // 1. Make API call with formData
    // 2. Wait for response
    // 3. Update products list
    // 4. Show success/error message
    
    // Example:
    // try {
    //   const response = await fetch('/api/products', {
    //     method: 'POST',
    //     body: formData
    //   });
    //   const newProduct = await response.json();
    //   setProducts([newProduct, ...products]);
    //   alert('Thêm sản phẩm thành công!');
    // } catch (error) {
    //   alert('Lỗi khi thêm sản phẩm!');
    // }
    
    alert('Đã gửi dữ liệu sản phẩm! (Xem console để kiểm tra)');
    setIsAddFormOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 font-alata">Quản lý sản phẩm</h2>
          <p className="text-sm text-gray-600 mt-1">Tổng {products.length} sản phẩm</p>
        </div>
        <button 
          onClick={() => setIsAddFormOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <FaPlus /> Thêm sản phẩm mới
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Tất cả danh mục</option>
          <option value="Đồ gốm">Đồ gốm</option>
          <option value="Đồ gỗ">Đồ gỗ</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Còn hàng">Còn hàng</option>
          <option value="Hết hàng">Hết hàng</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Sản phẩm</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Danh mục</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Giá</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Tồn kho</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Đã bán</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.map((product) => (
              <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500">IMG</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">ID: #{product.id}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">{product.category}</td>
                <td className="py-3 px-4 text-sm font-semibold text-primary">{formatCurrency(product.price)}</td>
                <td className="py-3 px-4 text-sm">
                  <span className={`${product.stock === 0 ? 'text-red-600' : product.stock < 20 ? 'text-orange-600' : 'text-gray-800'}`}>
                    {product.stock} cái
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{product.sales}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}>
                    {product.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800" title="Xem chi tiết">
                      <FaEye />
                    </button>
                    <button className="text-green-600 hover:text-green-800" title="Chỉnh sửa">
                      <FaEdit />
                    </button>
                    <button className="text-red-600 hover:text-red-800" title="Xóa">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredProducts.length)} trên tổng {filteredProducts.length} sản phẩm
        </p>
        <div className="flex gap-2">
          <button 
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 border border-gray-300 rounded-lg ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          >
            Trước
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === index + 1
                  ? 'bg-primary text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button 
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 border border-gray-300 rounded-lg ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          >
            Sau
          </button>
        </div>
      </div>

      {/* Add Product Form Modal */}
      <AddProductForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSubmit={handleAddProduct}
      />
    </div>
  );
};

export default ProductManagement;
