require("dotenv").config();
const express = require("express");
const cors = require("cors");

const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const invoiceRoutes = require("./routes/invoice.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);

app.listen(process.env.PORT, () => {
    console.log("Server running on port", process.env.PORT);
});
