const db = require('../config/db');

const getAll = async () => {
    const [rows] = await db.query('SELECT * FROM products');
    
    return rows;
};

const create = async (data) => {
    const { product_name, unit_price, tax_rate, description } = data;
    
    const [result] = await db.query(
        `INSERT INTO products (product_name, unit_price, tax_rate, description)
         VALUES (?, ?, ?, ?)`,
        [product_name, unit_price, tax_rate, description]
    );
    
    return result.insertId;
};

const update = async (id, data) => {
    const { product_name, unit_price, tax_rate, description } = data;
    
    await db.query(
        `UPDATE products SET product_name=?, unit_price=?, tax_rate=?, description=? WHERE product_id=?`,
        [product_name, unit_price, tax_rate, description, id]
    );
};

const remove = async (id) => {
    await db.query(`DELETE FROM products WHERE product_id=?`, [id]);
};

module.exports = {
    getAll,
    create,
    update,
    remove
};