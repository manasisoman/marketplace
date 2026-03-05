function TopProductsTable({ products, columns }) {
  if (!products || products.length === 0) {
    return <p className="text-muted">No product data available for this period.</p>;
  }

  return (
    <div className="top-products-table-wrapper">
      <table className="top-products-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={product.productId || index}>
              <td>{index + 1}</td>
              <td>{product.productName}</td>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.format ? col.format(product[col.key]) : product[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TopProductsTable;
