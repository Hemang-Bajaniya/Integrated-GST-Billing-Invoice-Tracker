// ---------- Topics: jQuery, DOM Manipulation, Event Handling, Ajax, Form Validation ----------

import Container from "../core/Container.js";
import JQueryHttpClient from "../core/JQueryHttpClient.js";
import { loadTable, saveEntity, deleteEntity } from "../utils/crud.util.js";
import { loadNavbar } from './loadnavbar.js';

loadNavbar();

const productTable = document.querySelector('#productTable');
const productForm = document.querySelector('#productFormEl');
const addProductBtn = document.querySelector('#addProductBtn');
const cancelProductBtn = document.querySelector('#cancelProduct');

const container = new Container(new JQueryHttpClient(), "http://localhost:3000");
const productApi = container.get("product");

let editingId = null;

// Load products
loadTable({
    api: productApi,
    tableSelector: '#productTable',
    fields: ['product_name', 'unit_price', 'tax_rate'],
    idKey: 'product_id',
    entityName: 'product'
});

// Edit & Delete
productTable.addEventListener('click', e => {

    if (e.target.closest('.delete-product')) {
        deleteEntity(
            productApi,
            e.target.dataset.id,
            e.target.closest('tr'),
            'product'
        );
    }

    if (e.target.closest('.edit-product')) {
        editingId = e.target.dataset.id;
        const cells = e.target.closest('tr').querySelectorAll('td');

        prodName.value = cells[0].textContent;
        prodPrice.value = cells[1].textContent;
        prodTax.value = cells[2].textContent;

        $(productForm).slideDown();
    }
});

// Open form
addProductBtn.addEventListener('click', () => {
    editingId = null;
    productForm.reset();
    $(productForm).slideDown();
});

// Cancel
cancelProductBtn.addEventListener('click', () => {
    productForm.reset();
    $(productForm).slideUp();
});


// Custom validation rule
$.validator.addMethod(
    "greaterThanZero",
    value => Number(value) > 0,
    "Value must be greater than 0"
);


// jQuery Validation
$("#productFormEl").validate({

    rules: {
        prodName: {
            required: true,
            minlength: 3
        },
        prodPrice: {
            required: true,
            greaterThanZero: true
        },
        prodTax: {
            required: true
        }
    },

    messages: {
        prodName: {
            required: "Product name is required",
            minlength: "Minimum 3 characters required"
        },
        prodPrice: {
            required: "Unit price is required",
            greaterThanZero: "Unit price must be greater than 0"
        },
        prodTax: {
            required: "Please select GST"
        }
    },

    errorClass: "is-invalid",
    errorElement: "small",

    errorPlacement: function (error, element) {
        error.addClass("text-danger");
        error.insertAfter(element);
    },

    submitHandler: async function (form) {

        const product = {
            product_name: prodName.value.trim(),
            unit_price: prodPrice.value,
            tax_rate: prodTax.value.replace('%', '')
        };

        await saveEntity({
            api: productApi,
            entity: product,
            editingId,
            tableSelector: '#productTable',
            fields: ['product_name', 'unit_price', 'tax_rate'],
            idKey: 'product_id',
            entityName: 'product'
        });

        editingId = null;
        form.reset();
        $(form).slideUp();
    }
});
