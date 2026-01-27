const Customer = require('../models/customer.model');

const getCustomers = async (req, res) => {
    try {
        const customers = await Customer.getAll();
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createCustomer = async (req, res) => {
    try {
        const id = await Customer.create(req.body);
        res.json({ message: 'Customer created', customer_id: id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateCustomer = async (req, res) => {
    await Customer.update(req.params.id, req.body);
    res.json({ message: 'Customer updated' });
};

const deleteCustomer = async (req, res) => {
    await Customer.remove(req.params.id);
    res.json({ message: 'Customer deleted' });
};


module.exports = {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
};