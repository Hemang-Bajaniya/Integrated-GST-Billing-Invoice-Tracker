import { useState, useEffect } from 'react'

function CustomerForm({ customer, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    if (customer) {
      setFormData({
        customer_name: customer.customer_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || ''
      })
    }
  }, [customer])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const form = e.currentTarget

    if (form.checkValidity() === false) {
      e.stopPropagation()
      setValidated(true)
      return
    }

    onSave(formData)
    setFormData({ customer_name: '', email: '', phone: '', address: '' })
    setValidated(false)
  }

  return (
    <div className="invoice-form show mb-3">
      <form onSubmit={handleSubmit} className={validated ? 'was-validated' : ''} noValidate>
        <div className="row">
          <div className="col-md-6 mb-2">
            <input
              type="text"
              name="customer_name"
              className="form-control"
              placeholder="Customer Name"
              value={formData.customer_name}
              onChange={handleChange}
              required
              minLength="3"
            />
            <div className="invalid-feedback">
              Customer name must be at least 3 characters.
            </div>
          </div>

          <div className="col-md-6 mb-2">
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <div className="invalid-feedback">
              Please enter a valid email address.
            </div>
          </div>

          <div className="col-md-6 mb-2">
            <input
              type="tel"
              name="phone"
              className="form-control"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
            />
            <div className="invalid-feedback">
              Phone number must be exactly 10 digits.
            </div>
          </div>

          <div className="col-md-12 mb-2">
            <input
              type="text"
              name="address"
              className="form-control"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              required
              minLength="5"
            />
            <div className="invalid-feedback">
              Address must be at least 5 characters.
            </div>
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

export default CustomerForm
