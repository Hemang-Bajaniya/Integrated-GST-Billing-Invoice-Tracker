import { useState } from 'react'

function InvoiceForm({ customers, products, onGenerate }) {
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [items, setItems] = useState([])
  const [errors, setErrors] = useState({})

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0, tax_rate: '' }])
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value

    if (field === 'product_id') {
      const product = products.find(p => p.product_id === parseInt(value))
      if (product) {
        newItems[index].unit_price = product.unit_price
        newItems[index].tax_rate = product.tax_rate
      }
    }

    setItems(newItems)
  }

  const calculateTotals = () => {
    let subtotal = 0
    let totalCgst = 0
    let totalSgst = 0

    items.forEach(item => {
      const itemTotal = item.quantity * item.unit_price
      subtotal += itemTotal

      const gstRate = parseFloat(item.tax_rate) / 100
      const gstAmount = itemTotal * gstRate
      totalCgst += gstAmount / 2
      totalSgst += gstAmount / 2
    })

    const grandTotal = subtotal + totalCgst + totalSgst

    return { subtotal, cgst: totalCgst, sgst: totalSgst, grandTotal }
  }

  const handleGenerate = () => {
    const newErrors = {}

    if (!selectedCustomer) {
      newErrors.customer = true
    }

    if (!invoiceDate) {
      newErrors.date = true
    }

    if (items.length === 0) {
      alert('Please add at least one item to the invoice')
      return
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const totals = calculateTotals()

    const invoiceData = {
      customer_id: parseInt(selectedCustomer),
      invoice_date: invoiceDate,
      subtotal: totals.subtotal,
      cgst: totals.cgst,
      sgst: totals.sgst,
      total_amount: totals.grandTotal,
      items: items.map(item => ({
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        tax_rate: item.tax_rate
      }))
    }

    onGenerate(invoiceData)
    
    // Reset form
    setSelectedCustomer('')
    setInvoiceDate('')
    setItems([])
    setErrors({})
  }

  const totals = calculateTotals()

  return (
    <>
      <div className="row mb-3">
        <div className="col-md-6">
          <label>Customer</label>
          <select
            className="form-select"
            value={selectedCustomer}
            onChange={(e) => {
              setSelectedCustomer(e.target.value)
              setErrors({ ...errors, customer: false })
            }}
          >
            <option value="">Select Customer</option>
            {customers.map(customer => (
              <option key={customer.customer_id} value={customer.customer_id}>
                {customer.customer_name}
              </option>
            ))}
          </select>
          {errors.customer && (
            <small className="text-danger">Please select a customer</small>
          )}
        </div>

        <div className="col-md-6">
          <label>Date</label>
          <input
            type="date"
            className="form-control"
            value={invoiceDate}
            onChange={(e) => {
              setInvoiceDate(e.target.value)
              setErrors({ ...errors, date: false })
            }}
          />
          {errors.date && (
            <small className="text-danger">Please select invoice date</small>
          )}
        </div>
      </div>

      <div className="mb-3">
        {items.map((item, index) => (
          <div key={index} className="row mb-2 align-items-center">
            <div className="col-md-5">
              <select
                className="form-select"
                value={item.product_id}
                onChange={(e) => updateItem(index, 'product_id', e.target.value)}
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product.product_id} value={product.product_id}>
                    {product.product_name} - ₹{product.unit_price}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <input
                type="number"
                className="form-control"
                placeholder="Quantity"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                min="1"
              />
            </div>

            <div className="col-md-2">
              <input
                type="text"
                className="form-control"
                value={item.tax_rate}
                readOnly
                placeholder="GST"
              />
            </div>

            <div className="col-md-2">
              <button
                className="btn btn-danger btn-sm w-100"
                onClick={() => removeItem(index)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-secondary btn-sm mb-3" onClick={addItem}>
        + Add Item
      </button>

      <table className="table table-sm mt-4">
        <tbody>
          <tr>
            <td>Subtotal</td>
            <td>₹{totals.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>CGST</td>
            <td>₹{totals.cgst.toFixed(2)}</td>
          </tr>
          <tr>
            <td>SGST</td>
            <td>₹{totals.sgst.toFixed(2)}</td>
          </tr>
          <tr className="fw-bold">
            <td>Total</td>
            <td>₹{totals.grandTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <button className="btn btn-primary" onClick={handleGenerate}>
        Generate Invoice
      </button>
    </>
  )
}

export default InvoiceForm
