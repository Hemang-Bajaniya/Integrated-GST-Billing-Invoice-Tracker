const db = require('../config/db');

const getAll = async () => {
    const [rows] = await db.query('SELECT * FROM customers');
    
    return rows;
};

const create = async (data) => {
    const { customer_name, email, phone, address } = data;
    
    const [result] = await db.query(
        `INSERT INTO customers (customer_name, email, phone, address)
         VALUES (?, ?, ?, ?)`,
        [customer_name, email, phone, address]
    );
    
    return result.insertId;
};

const update = async (id, data) => {
    const { customer_name, email, phone, address } = data;
    
    await db.query(
        `UPDATE customers SET customer_name=?, email=?, phone=?, address=? WHERE customer_id=?`,
        [customer_name, email, phone, address, id]
    );
};

const remove = async (id) => {
    await db.query(`DELETE FROM customers WHERE customer_id=?`, [id]);
};



module.exports = {
    getAll,
    create,
    update,
    remove,
};