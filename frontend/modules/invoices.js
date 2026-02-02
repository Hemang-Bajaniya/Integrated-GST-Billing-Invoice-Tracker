// ---------- Topics: jQuery, DOM Manipulation, Event Handling, Ajax, Form Validation, Date Handling, Math Operations ----------

import Container from "../core/Container.js";
import { logError } from "../utils/error.util.js";
import JQueryHttpClient from "../core/JQueryHttpClient.js";
import { loadNavbar } from './loadnavbar.js';

loadNavbar();

const container = new Container(new JQueryHttpClient(), "http://localhost:3000");
const invoiceApi = container.get("invoice");
const productApi = container.get("product");
const customerApi = container.get("customer");

let options = '';

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

// jQuery Events – click
$('#addItemBtn').click(() => {
    addInvoiceItem(options);
});

async function loadProducts() {
    try {
        const data = await productApi.getAll();

        options = '<option value="">Select Product</option>';
        data.forEach(p =>
            options += `<option value="${p.product_id}" data-price="${p.unit_price}">${p.product_name}</option>`
        );
    }
    catch (err) {
        logError('Error loading products: ' + err.responseText);
    }
}

loadProducts();

async function loadCustomers() {
    try {
        const data = await customerApi.getAll();

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

loadCustomers();


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

// jQuery Events – change & input
$(document).on('change', '.product-select', calculateTotals);
$(document).on('input', '.item-qty', calculateTotals);

// jQuery DOM Traversing
$(document).on('click', '.remove-item', function () {
    $(this).closest('.invoice-item').remove();
    calculateTotals();
});

// JavaScript Date Handling
function setTodayDate() {
    $('#invoiceDate').val(new Date().toISOString().split('T')[0]);
}

setTodayDate();

// jQuery Events + Ajax POST
$("#generateInvoice").click(async () => {

    const customerId = $('#customerSelect').val();

    if (!customerId) {
        alert('Please select a customer');
        return;
    }

    if (!validateInvoice()) return;

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
        grand_total: parseFloat($('#grandTotal').text().replace('₹', '')),
        items
    };
    console.log("Invoice to be sent:", invoice);
    try {
        const newInvoice = await invoiceApi.add(invoice);
        alert('Invoice generated successfully!');
    }
    catch (err) {
        logError(err, 'generate-invoice');
    }
});


// Function to validate invoice form
function validateInvoice() {

    let isValid = true;

    // Reset states
    $('.is-invalid').removeClass('is-invalid');
    $('.text-danger').addClass('d-none');

    // Customer validation
    if (!$('#customerSelect').val()) {
        $('#customerSelect').addClass('is-invalid');
        $('#customerError').removeClass('d-none');
        isValid = false;
    }

    // Date validation
    if (!$('#invoiceDate').val()) {
        $('#invoiceDate').addClass('is-invalid');
        $('#dateError').removeClass('d-none');
        isValid = false;
    }

    // Invoice items validation
    if ($('.invoice-item').length === 0) {
        alert('Please add at least one invoice item');
        return false;
    }

    $('.invoice-item').each(function () {

        const product = $(this).find('.product-select');
        const qty = $(this).find('.item-qty');

        if (!product.val()) {
            product.addClass('is-invalid');
            isValid = false;
        }

        if (!qty.val() || qty.val() <= 0) {
            qty.addClass('is-invalid');
            isValid = false;
        }
    });

    if (!isValid) {
        alert('Please fix the highlighted errors');
    }

    return isValid;
}
