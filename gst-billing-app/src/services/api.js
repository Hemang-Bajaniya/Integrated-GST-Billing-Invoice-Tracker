const API_BASE_URL = 'http://localhost:3000/api'

class ApiService {
  async request(url, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(url, options)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }

  // Customer API
  getCustomers() {
    return this.request(`${API_BASE_URL}/customers`)
  }

  addCustomer(customer) {
    return this.request(`${API_BASE_URL}/customers`, 'POST', customer)
  }

  updateCustomer(id, customer) {
    return this.request(`${API_BASE_URL}/customers/${id}`, 'PUT', customer)
  }

  deleteCustomer(id) {
    return this.request(`${API_BASE_URL}/customers/${id}`, 'DELETE')
  }

  // Product API
  getProducts() {
    return this.request(`${API_BASE_URL}/products`)
  }

  addProduct(product) {
    return this.request(`${API_BASE_URL}/products`, 'POST', product)
  }

  updateProduct(id, product) {
    return this.request(`${API_BASE_URL}/products/${id}`, 'PUT', product)
  }

  deleteProduct(id) {
    return this.request(`${API_BASE_URL}/products/${id}`, 'DELETE')
  }

  // Invoice API
  getInvoices() {
    return this.request(`${API_BASE_URL}/invoices`)
  }

  addInvoice(invoice) {
    return this.request(`${API_BASE_URL}/invoices`, 'POST', invoice)
  }
}

export default new ApiService()
