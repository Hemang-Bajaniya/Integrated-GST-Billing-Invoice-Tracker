import { useState, useEffect } from 'react'

function ProductForm({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    product_name: '',
    unit_price: '',
    tax_rate: '18%'
  })

  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name || '',
        unit_price: product.unit_price || '',
        tax_rate: product.tax_rate || '18%'
      })
    }
  }, [product])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    setFormData({ product_name: '', unit_price: '', tax_rate: '18%' })
  }

  return (
    <div className="invoice-form show mb-3">
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-4 mb-2">
            <input
              type="text"
              name="product_name"
              className="form-control"
              placeholder="Product Name"
              value={formData.product_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-4 mb-2">
            <input
              type="number"
              name="unit_price"
              className="form-control"
              placeholder="Unit Price"
              value={formData.unit_price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="col-md-4 mb-2">
            <select
              name="tax_rate"
              className="form-select"
              value={formData.tax_rate}
              onChange={handleChange}
              required
            >
              <option value="">Select GST</option>
              <option value="5%">5%</option>
              <option value="12%">12%</option>
              <option value="18%">18%</option>
              <option value="28%">28%</option>
            </select>
          </div>

          <div className="col-12">
            <button type="submit" className="btn btn-primary">
              Save
            </button>
            <button type="button" className="btn btn-secondary ms-2" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ProductForm
