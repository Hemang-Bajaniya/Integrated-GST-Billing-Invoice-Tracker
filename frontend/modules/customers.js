// ---------- Topics: jQuery, done, fail ----------

import Container from "../core/Container.js";
import JQueryHttpClient from "../core/JQueryHttpClient.js";
import { loadTable, saveEntity, deleteEntity } from "../utils/crud.util.js";
import { loadNavbar } from './loadnavbar.js';

loadNavbar();

const container = new Container(new JQueryHttpClient(), "http://localhost:3000");
const customerApi = container.get("customer");

// Load and display customers on page load
let editingId = null;

loadTable({
    api: customerApi,
    tableSelector: '#customerTable',
    fields: ['customer_name', 'email', 'phone'],
    idKey: 'customer_id',
    entityName: 'customer'
});


// Save customer (add or update)
const form = document.querySelector('#customerFormEl');

form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const customer = {
        customer_name: $('#custName').val(),
        email: $('#custEmail').val(),
        phone: $('#custPhone').val(),
        address: $('#custAddress').val()
    };

    await saveEntity({
        api: customerApi,
        entity: customer,
        editingId,
        tableSelector: '#customerTable',
        fields: ['customer_name', 'email', 'phone'],
        idKey: 'customer_id',
        entityName: 'customer'
    });

    editingId = null;
    form.reset();
    form.classList.remove('was-validated');
    $('#customerForm').slideUp();
});


// Delete customer on delete button click
$('#customerTable').on('click', '.delete-customer', function () {
    deleteEntity(
        customerApi,
        $(this).data('id'),
        $(this).closest('tr'),
        'customer'
    );
});

// Open edit form on edit button click
// Event delegation
$('#customerTable').on('click', '.edit-customer', function () {
    editingId = $(this).data('id');
    const row = $(this).closest('tr');

    $('#custName').val(row.find('td:eq(0)').text());
    $('#custEmail').val(row.find('td:eq(1)').text());
    $('#custPhone').val(row.find('td:eq(2)').text());

    $('#customerForm').slideDown();
});

// Open add form on add button click
$('#addCustomerBtn').click(() => $('#customerForm').slideDown());
// Cancel button hides the form
$('#cancelCustomer').click(() => {
    form.reset();
    form.classList.remove('was-validated');

    $('#customerForm').slideUp()
});


// $.validator.addMethod("noChars", function(value, element) {
//     console.log("Inside custPhone", value)
//     return !isNaN(value);
// },
// "Only digits are allowed");

// $("#customerFormEl").validate({
//     rules: {
//         custPhone: {
//             noChars: true
//         }
//     },
//     messages:{
//         custPhone:{
//             noChars: "Phone number must not contain letters or special characters"
//         }
//     },

//     submitHandler: function(form) {
//         form.submit();
//     }
// });