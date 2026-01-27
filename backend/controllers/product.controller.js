const Product = require('../models/product.model');

const getProducts = async (req, res) => {
    try {
        const products = await Product.getAll();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const id = await Product.create(req.body);
        res.json({ message: 'Product created', product_id: id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateProduct = async (req, res) => {
    await Product.update(req.params.id, req.body);
    res.json({ message: 'Product updated' });
};

const deleteProduct = async (req, res) => {
    await Product.remove(req.params.id);
    res.json({ message: 'Product deleted' });
};

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
};