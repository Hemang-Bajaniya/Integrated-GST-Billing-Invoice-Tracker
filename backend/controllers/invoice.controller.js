const Invoice = require('../models/invoice.model');

const createInvoice = async (req, res) => {
    try {
        const { invoice, items } = req.body;
        const id = await Invoice.createInvoice(invoice, items);
        res.json({ message: 'Invoice created', invoice_id: id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.getAll();
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createInvoice,
    getInvoices,
};
