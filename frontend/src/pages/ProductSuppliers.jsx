import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { Link2, Plus, Edit, X, Save, Package, Building2, RefreshCw, AlertCircle, Search, ChevronDown, DollarSign } from 'lucide-react';
import { showSuccess, showError, showWarning } from '../utils/toast.js';
import { apiGet, apiPost, apiPut } from '../utils/api.js';
import { CURRENCY_SYMBOL } from '../config/currency.js';

const ProductSuppliers = () => {
  const [productSuppliers, setProductSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProductSupplier, setEditingProductSupplier] = useState(null);
  const [formData, setFormData] = useState({
    product: '',
    supplier: '',
    supplier_product_code: '',
    cost_price: '',
    moq: 1
  });
  const [productSearch, setProductSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const fetchProducts = async () => {
    try {
      let allProducts = [];
      let endpoint = '/inventory';
      
      while (endpoint) {
        const response = await apiGet(endpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const transformedProducts = data.results.map(product => ({
          id: product.id,
          name: product.name,
          barcode: product.barcode
        }));
        
        allProducts = [...allProducts, ...transformedProducts];
        
        if (data.next) {
          const url = new URL(data.next);
          endpoint = url.pathname + url.search;
        } else {
          endpoint = null;
        }
      }
      
      setProducts(allProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await apiGet('/supply-chain/suppliers/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSuppliers(data.results || data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchProductSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet('/supply-chain/productsuppliers/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProductSuppliers(data.results || data || []);
    } catch (error) {
      console.error('Error fetching product suppliers:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductSuppliers();
    fetchProducts();
    fetchSuppliers();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProductDropdown && !event.target.closest('.product-dropdown-container')) {
        setShowProductDropdown(false);
      }
      if (showSupplierDropdown && !event.target.closest('.supplier-dropdown-container')) {
        setShowSupplierDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProductDropdown, showSupplierDropdown]);

  const handleOpenModal = (productSupplier = null) => {
    if (productSupplier) {
      setEditingProductSupplier(productSupplier);
      setFormData({
        product: productSupplier.product || productSupplier.product_id || '',
        supplier: productSupplier.supplier || productSupplier.supplier_id || '',
        supplier_product_code: productSupplier.supplier_product_code || '',
        cost_price: productSupplier.cost_price || '',
        moq: productSupplier.moq || 1
      });
      const product = products.find(p => p.id === (productSupplier.product || productSupplier.product_id));
      const supplier = suppliers.find(s => s.id === (productSupplier.supplier || productSupplier.supplier_id));
      setProductSearch(product ? product.name : '');
      setSupplierSearch(supplier ? supplier.name : '');
    } else {
      setEditingProductSupplier(null);
      setFormData({
        product: '',
        supplier: '',
        supplier_product_code: '',
        cost_price: '',
        moq: 1
      });
      setProductSearch('');
      setSupplierSearch('');
    }
    setShowProductDropdown(false);
    setShowSupplierDropdown(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProductSupplier(null);
    setProductSearch('');
    setSupplierSearch('');
    setShowProductDropdown(false);
    setShowSupplierDropdown(false);
    setFormData({
      product: '',
      supplier: '',
      supplier_product_code: '',
      cost_price: '',
      moq: 1
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.product || !formData.supplier || !formData.cost_price) {
      showWarning('Please fill in all required fields');
      return;
    }

    try {
      const submitData = {
        product: parseInt(formData.product),
        supplier: parseInt(formData.supplier),
        supplier_product_code: formData.supplier_product_code || null,
        cost_price: parseFloat(formData.cost_price),
        moq: parseInt(formData.moq) || 1
      };

      if (editingProductSupplier) {
        const response = await apiPut(`/supply-chain/productsuppliers/${editingProductSupplier.id}/`, submitData);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }

        showSuccess('Product supplier updated successfully!');
      } else {
        const response = await apiPost('/supply-chain/productsuppliers/', submitData);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }

        showSuccess('Product supplier created successfully!');
      }

      handleCloseModal();
      fetchProductSuppliers();
    } catch (error) {
      console.error('Error saving product supplier:', error);
      showError(`Failed to save product supplier: ${error.message}`);
    }
  };

  const getProductName = (productSupplier) => {
    const productId = productSupplier.product || productSupplier.product_id;
    if (!productId) return 'N/A';
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'N/A';
  };

  const getSupplierName = (productSupplier) => {
    const supplierId = productSupplier.supplier || productSupplier.supplier_id;
    if (!supplierId) return 'N/A';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'N/A';
  };

  const filteredProducts = products.filter(productItem => {
    const searchLower = productSearch.toLowerCase();
    return productItem.name.toLowerCase().includes(searchLower) || 
           (productItem.barcode && productItem.barcode.toLowerCase().includes(searchLower));
  });

  const filteredSuppliers = suppliers.filter(supplierItem => {
    const searchLower = supplierSearch.toLowerCase();
    return supplierItem.name.toLowerCase().includes(searchLower) || 
           (supplierItem.email && supplierItem.email.toLowerCase().includes(searchLower)) ||
           (supplierItem.phone_number && supplierItem.phone_number.includes(searchLower));
  });

  const handleSelectProduct = (selectedProduct) => {
    setFormData(prev => ({ ...prev, product: selectedProduct.id }));
    setProductSearch(selectedProduct.name);
    setShowProductDropdown(false);
  };

  const handleSelectSupplier = (selectedSupplier) => {
    setFormData(prev => ({ ...prev, supplier: selectedSupplier.id }));
    setSupplierSearch(selectedSupplier.name);
    setShowSupplierDropdown(false);
  };

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Product Suppliers</h1>
            <p className="text-gray-600">Manage product-supplier relationships and pricing</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={20} />
              Add Product Supplier
            </button>
            <button
              onClick={fetchProductSuppliers}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>Error loading product suppliers: {error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading product suppliers...</p>
          </div>
        )}

        {/* Statistics Card */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Product-Supplier Links</p>
                  <p className="text-3xl font-bold text-gray-800">{productSuppliers.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Link2 size={28} className="text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Suppliers Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Supplier Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cost Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    MOQ
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productSuppliers.map((productSupplier) => (
                  <tr key={productSupplier.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                          <Package className="text-blue-600" size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800">{getProductName(productSupplier)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                          <Building2 className="text-green-600" size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800">{getSupplierName(productSupplier)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800">
                        {productSupplier.supplier_product_code || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                        <DollarSign size={14} className="text-gray-400" />
                        {CURRENCY_SYMBOL} {parseFloat(productSupplier.cost_price || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-800">{productSupplier.moq || 1}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleOpenModal(productSupplier)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Product Supplier"
                      >
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {!loading && !error && productSuppliers.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Link2 size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Product Suppliers Found</h3>
            <p className="text-gray-500 mb-4">Get started by linking a product to a supplier</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Add First Product Supplier
            </button>
          </div>
        )}

        {/* Add/Edit Product Supplier Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingProductSupplier ? 'Edit Product Supplier' : 'Add Product Supplier'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative product-dropdown-container">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product *
                  </label>
                  <div className="relative">
                    <div className="flex items-center">
                      <Search size={18} className="absolute left-3 text-gray-400" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        placeholder="Search for a product..."
                        className="w-full pl-10 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        required
                      />
                      <ChevronDown 
                        size={18} 
                        className="absolute right-3 text-gray-400 cursor-pointer"
                        onClick={() => setShowProductDropdown(!showProductDropdown)}
                      />
                    </div>
                    {showProductDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((productItem) => (
                            <div
                              key={productItem.id}
                              onClick={() => handleSelectProduct(productItem)}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-800">
                                {productItem.name}
                              </div>
                              {productItem.barcode && (
                                <div className="text-sm text-gray-500">
                                  Barcode: {productItem.barcode}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500 text-sm">
                            No products found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.product && (
                    <p className="mt-1 text-xs text-gray-500">
                      Selected: {productSearch}
                    </p>
                  )}
                </div>

                <div className="relative supplier-dropdown-container">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Supplier *
                  </label>
                  <div className="relative">
                    <div className="flex items-center">
                      <Search size={18} className="absolute left-3 text-gray-400" />
                      <input
                        type="text"
                        value={supplierSearch}
                        onChange={(e) => {
                          setSupplierSearch(e.target.value);
                          setShowSupplierDropdown(true);
                        }}
                        onFocus={() => setShowSupplierDropdown(true)}
                        placeholder="Search for a supplier..."
                        className="w-full pl-10 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        required
                      />
                      <ChevronDown 
                        size={18} 
                        className="absolute right-3 text-gray-400 cursor-pointer"
                        onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                      />
                    </div>
                    {showSupplierDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredSuppliers.length > 0 ? (
                          filteredSuppliers.map((supplierItem) => (
                            <div
                              key={supplierItem.id}
                              onClick={() => handleSelectSupplier(supplierItem)}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-800">
                                {supplierItem.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {supplierItem.email} • {supplierItem.phone_number}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500 text-sm">
                            No suppliers found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.supplier && (
                    <p className="mt-1 text-xs text-gray-500">
                      Selected: {supplierSearch}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Supplier Product Code
                    </label>
                    <input
                      type="text"
                      value={formData.supplier_product_code}
                      onChange={(e) => setFormData({ ...formData, supplier_product_code: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Supplier's product code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cost Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Minimum Order Quantity (MOQ)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.moq}
                    onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Save size={18} />
                    {editingProductSupplier ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductSuppliers;
