import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { Tag, Plus, Edit, X, Save, RefreshCw, Package, AlertCircle } from 'lucide-react';
import { showSuccess, showWarning, showError } from '../utils/toast.js';
import { apiGet, apiPost, apiPut } from '../utils/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const Categories = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet('/inventory/categories/');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const categoriesArray = data.results || data || [];
      setCategories(categoriesArray);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for authentication to be ready before fetching
    if (!authLoading && isAuthenticated) {
      fetchCategories();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        description: category.description || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: ''
    });
    setSaving(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.name.trim()) {
      showWarning('Please enter a category name');
      return;
    }

    setSaving(true);

    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null
      };

      if (editingCategory) {
        // Update existing category
        const response = await apiPut(`/inventory/categories/${editingCategory.id}/details/`, categoryData);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }

        showSuccess(`Category "${formData.name}" updated successfully!`);
      } else {
        // Create new category
        const response = await apiPost('/inventory/categories/', categoryData);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }

        showSuccess(`Category "${formData.name}" added successfully!`);
      }

      handleCloseModal();
      // Refresh the categories list
      await fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      showError(error.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const totalItems = categories.reduce((sum, c) => sum + (c.items_count || 0), 0);

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Categories Management</h1>
            <p className="text-gray-600">Manage product categories</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={20} />
              Add Category
            </button>
            <button
              onClick={fetchCategories}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Categories</p>
                <p className="text-3xl font-bold text-gray-800">{categories.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Tag size={28} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Items</p>
                <p className="text-3xl font-bold text-gray-800">{totalItems}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Package size={28} className="text-green-600" />
              </div>
            </div>
          </div>

        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
            <div>
              <p className="text-red-800 font-semibold">Error loading categories</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Categories Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <Tag className="text-gray-400 mx-auto mb-4" size={48} />
              <p className="text-gray-600 text-lg font-semibold mb-2">No categories found</p>
              <p className="text-gray-500">Get started by adding your first category</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Items Count
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 p-2 rounded-full flex-shrink-0">
                            <Tag className="text-purple-600" size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-800">{category.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {category.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-gray-400" />
                          <span className="text-sm font-semibold text-gray-800">
                            {category.items_count || 0} items
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Category"
                        >
                          <Edit size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Category Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-md w-full my-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    rows="3"
                    placeholder="Optional description for this category"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={saving}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        {editingCategory ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        {editingCategory ? 'Update' : 'Create'}
                      </>
                    )}
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

export default Categories;


