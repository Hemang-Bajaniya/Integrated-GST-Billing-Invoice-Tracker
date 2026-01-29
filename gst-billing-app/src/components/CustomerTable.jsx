function CustomerTable({ customers, onEdit, onDelete }) {
  return (
    <table className="table table-hover">
      <thead className="table-light">
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {customers.map((customer) => (
          <tr key={customer.customer_id}>
            <td>{customer.customer_name}</td>
            <td>{customer.email}</td>
            <td>{customer.phone}</td>
            <td>
              <button
                className="btn btn-sm btn-primary btn-action"
                onClick={() => onEdit(customer)}
              >
                Edit
              </button>
              <button
                className="btn btn-sm btn-danger btn-action"
                onClick={() => onDelete(customer.customer_id)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default CustomerTable
