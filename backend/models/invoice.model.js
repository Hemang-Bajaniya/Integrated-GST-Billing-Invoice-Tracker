const db = require('../config/db');

const createInvoice = async (invoice, items) => {

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [invResult] = await conn.query(
            `INSERT INTO invoices
            (invoice_number, user_id, customer_id, invoice_date,
             subtotal, cgst, sgst, igst, grand_total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoice.invoice_number,
                invoice.user_id,
                invoice.customer_id,
                invoice.invoice_date,
                invoice.subtotal,
                invoice.cgst,
                invoice.sgst,
                invoice.igst,
                invoice.grand_total
            ]
        );

        const invoiceId = invResult.insertId;

        for (let item of items) {
            await conn.query(
                `INSERT INTO invoice_items
                (invoice_id, product_id, quantity, unit_price, tax_rate, line_total)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    invoiceId,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.tax_rate,
                    item.line_total
                ]
            );
        }

        await conn.commit();
        return invoiceId;
    } catch (err) {
        console.log('Error creating invoice:', err);
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};



module.exports = {
    createInvoice,
};