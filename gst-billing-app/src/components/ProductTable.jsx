function ProductTable({ products, onEdit, onDelete }) {
  return (
    <table className="table table-hover">
      <thead className="table-light">
        <tr>
          <th>Product</th>
          <th>Price</th>
          <th>GST</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.product_id}>
            <td>{product.product_name}</td>
            <td>₹{parseFloat(product.unit_price).toFixed(2)}</td>
            <td>{product.tax_rate}</td>
            <td>
              <button
                className="btn btn-sm btn-primary btn-action"
                onClick={() => onEdit(product)}
              >
                Edit
              </button>
              <button
                className="btn btn-sm btn-danger btn-action"
                onClick={() => onDelete(product.product_id)}
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

export default ProductTable
