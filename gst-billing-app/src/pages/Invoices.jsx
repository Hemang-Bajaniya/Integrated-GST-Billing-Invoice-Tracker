import { useState, useEffect } from 'react'
import api from '../services/api'
import InvoiceForm from '../components/InvoiceForm'

function Invoices() {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    loadCustomers()
    loadProducts()
  }, [])

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers()
      setCustomers(data)
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await api.getProducts()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const handleGenerateInvoice = async (invoiceData) => {
    try {
      await api.addInvoice(invoiceData)
      alert('Invoice generated successfully!')
    } catch (error) {
      console.error('Error generating invoice:', error)
      alert('Failed to generate invoice')
    }
  }

  return (
    <div className="container">
      <section>
        <h2 className="mb-4">Invoice Management</h2>

        <div className="card">
          <div className="card-header">Create Invoice</div>

          <div className="card-body">
            <InvoiceForm
              customers={customers}
              products={products}
              onGenerate={handleGenerateInvoice}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

export default Invoices
