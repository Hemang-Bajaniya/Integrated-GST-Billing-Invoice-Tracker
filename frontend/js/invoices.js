import { getCustomers } from "./services/customer.service.js";
import { getProducts, addProduct, updateProduct, deleteProduct } from "./services/product.service.js";
import { addInvoice } from "./services/invoice.service.js";
import { logError } from "./utils/error.util.js";

async function loadCustomers() {
     try {
         const data = await getCustomers();
            let options = '<option value="">Select Customer</option>';
            data.forEach(c =>
                options += `<option value="${c.customer_id}">${c.customer_name}</option>`
            );

            $('#customerSelect').html(options);
     }
        catch (err) {
            logError('Error loading customers: ' + err.responseText);
        }
}

async function loadProducts() {
    try {
        const data = await getProducts();
        let options = '<option value="">Select Product</option>';
        data.forEach(p =>
            options += `<option value="${p.product_id}" data-price="${p.unit_price}">${p.product_name}</option>`
        );
        $('#productSelect').html(options);
    }
    catch (err) {
        logError('Error loading products: ' + err.responseText);
    }
}

loadCustomers();

loadProducts();

// JavaScript Date Object
setTodayDate();

// jQuery Events – click
$('#addItemBtn').click(addInvoiceItem);

// jQuery Events – change & input
$(document).on('change', '.product-select', calculateTotals);
$(document).on('input', '.item-qty', calculateTotals);

// jQuery DOM Traversing
$(document).on('click', '.remove-item', function () {
    $(this).closest('.invoice-item').remove();
    calculateTotals();
});



// make it separate file for html components
function addInvoiceItem(options) {
    $('#invoiceItems').append(`
        <div class="row invoice-item mb-2">
            <div class="col-md-5">
                <select class="form-select product-select">${options}</select>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-qty" value="1">
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control item-price" readonly>
            </div>
            <div class="col-md-2">
                <button class="btn btn-danger remove-item">X</button>
            </div>
        </div>
    `);
}

// JavaScript Math + jQuery Traversing
function calculateTotals() {

    let subtotal = 0;

    $('.invoice-item').each(function () {

        const price = $(this).find(':selected').data('price') || 0;
        const qty = $(this).find('.item-qty').val() || 0;

        $(this).find('.item-price').val(price);
        subtotal += price * qty;
    });

    // JavaScript Math Operations
    const tax = subtotal * 0.18;

    $('#subtotal').text(`₹${subtotal.toFixed(2)}`);
    $('#cgst').text(`₹${(tax / 2).toFixed(2)}`);
    $('#sgst').text(`₹${(tax / 2).toFixed(2)}`);
    $('#grandTotal').text(`₹${(subtotal + tax).toFixed(2)}`);
}

// JavaScript Date Handling
function setTodayDate() {
    $('#invoiceDate').val(new Date().toISOString().split('T')[0]);
}

// jQuery Events + Ajax POST
$("#generateInvoice").click(async () =>{

    const customerId = $('#customerSelect').val();

    if (!customerId) {
        alert('Please select a customer');
        return;
    }

    // JavaScript Object Creation
    const invoice = {
        invoice_number: `INV-${Date.now()}`,
        user_id: 1,
        customer_id: customerId,
        invoice_date: $('#invoiceDate').val(),
        subtotal: parseFloat($('#subtotal').text().replace('₹', '')),
        cgst: parseFloat($('#cgst').text().replace('₹', '')),
        sgst: parseFloat($('#sgst').text().replace('₹', '')),
        igst: 0,
        grand_total: parseFloat($('#grandTotal').text().replace('₹', ''))
    };

    const items = [];

    // JavaScript Loop + jQuery Traversing
    $('.invoice-item').each(function () {

        const productId = $(this).find('.product-select').val();
        if (!productId) return;

        items.push({
            product_id: productId,
            quantity: parseInt($(this).find('.item-qty').val()),
            unit_price: parseFloat($(this).find('.item-price').val()),
            tax_rate: 18,
            line_total: parseFloat($(this).find('.item-price').val()) *
                parseInt($(this).find('.item-qty').val())
        });
    });

    try {
        const newInvoice = await addInvoice({ invoice, items });
        alert('Invoice generated successfully!');
    }
    catch (err) {
        logError(err, 'generate-invoice');
    }
});

