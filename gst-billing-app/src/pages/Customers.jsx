import { useState, useEffect } from 'react'
import api from '../services/api'
import CustomerForm from '../components/CustomerForm'
import CustomerTable from '../components/CustomerTable'

function Customers() {
  const [customers, setCustomers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers()
      setCustomers(data)
    } catch (error) {
      console.error('Error loading customers:', error)
      alert('Failed to load customers')
    }
  }

  const handleSave = async (customer) => {
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.customer_id, customer)
      } else {
        await api.addCustomer(customer)
      }
      loadCustomers()
      setShowForm(false)
      setEditingCustomer(null)
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('Failed to save customer')
    }
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.deleteCustomer(id)
        loadCustomers()
      } catch (error) {
        console.error('Error deleting customer:', error)
        alert('Failed to delete customer')
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCustomer(null)
  }

  return (
    <div className="container">
      <section>
        <h2 className="mb-4">Customer Management</h2>

        <div className="card">
          <div className="card-header">
            Customer List
            <button 
              className="btn btn-sm btn-light float-end" 
              onClick={() => setShowForm(true)}
            >
              + Add Customer
            </button>
          </div>

          <div className="card-body">
            {showForm && (
              <CustomerForm
                customer={editingCustomer}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            )}

            <CustomerTable
              customers={customers}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

export default Customers
