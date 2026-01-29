import { useState, useEffect } from 'react'
import api from '../services/api'
import ProductForm from '../components/ProductForm'
import ProductTable from '../components/ProductTable'

function Products() {
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await api.getProducts()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
      alert('Failed to load products')
    }
  }

  const handleSave = async (product) => {
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.product_id, product)
      } else {
        await api.addProduct(product)
      }
      loadProducts()
      setShowForm(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Failed to save product')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(id)
        loadProducts()
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Failed to delete product')
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProduct(null)
  }

  return (
    <div className="container">
      <section>
        <h2 className="mb-4">Product Management</h2>

        <div className="card">
          <div className="card-header">
            Product List
            <button
              className="btn btn-sm btn-light float-end"
              onClick={() => setShowForm(true)}
            >
              + Add Product
            </button>
          </div>

          <div className="card-body">
            {showForm && (
              <ProductForm
                product={editingProduct}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            )}

            <ProductTable
              products={products}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

export default Products
