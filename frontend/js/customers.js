// jQuery, done, fail
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from "./services/customer.service.js";
import { displayRow } from "./utils/table.util.js";
import { logError } from "./utils/error.util.js";

// Load and display customers on page load
getCustomers()
    .then((data) => {
        data.forEach(c => {
            $('#customerTable').append(
                displayRow({
                    entity: c,
                    fields: ['customer_name', 'email', 'phone'],
                    idKey: 'customer_id',
                    entityName: 'customer'
                })
            );
        })
    })
    .catch((err) => {
        logError(err, 'get-customer')
    });

// Save customer (add or update)
$('#saveCustomer').click(function () {

    const customer = {
        customer_name: $('#custName').val(),
        email: $('#custEmail').val(),
        phone: $('#custPhone').val(),
        address: $('#custAddress').val()
    };

    if (editingCustomerId) {
        updateCustomer(editingCustomerId, customer)
            .then(updated => {

                $(`#customerTable tr[data-id="${editingCustomerId}"]`)
                    .replaceWith(
                        displayRow({
                            entity: updated,
                            fields: ['customer_name', 'email', 'phone'],
                            idKey: 'customer_id',
                            entityName: 'customer'
                        })
                    );

                editingCustomerId = null;
                $('#customerForm').slideUp();
            })
            .catch(err => logError(err, 'update-customer'));
    }
    else {
        addCustomer(customer)
            .then(newCustomer => {

                $('#customerTable').append(
                    displayRow({
                        entity: newCustomer,
                        fields: ['customer_name', 'email', 'phone'],
                        idKey: 'customer_id',
                        entityName: 'customer'
                    })
                );

                $('#customerForm').slideUp();
            })
            .catch(err => logError(err, 'add-customer'));
    }
});

// Delete customer on delete button click
$(document).on('click', '.delete-customer', function() {
    const id = $(this).data('id');
    if (!id) return;

    if (!confirm('Are you sure you want to delete this customer?')) return;

    deleteCustomer(id)
        .then(() => {
            $(`#customerTable tr[data-id="${id}"]`).remove();
        })
        .catch((err) => {
            logError(err, 'delete-customer');
        });
});

// Open add form on add button click
$('#addCustomerBtn').click(() => $('#customerForm').slideDown());

// Cancel button hides the form
$('#cancelCustomer').click(() => $('#customerForm').slideUp());


// Open edit form on edit button click
let editingCustomerId = null;

// Event delegation
$('#customerTable').on('click', '.edit-customer', function () {

    editingCustomerId = $(this).data('id');

    const row = $(this).closest('tr');

    $('#custName').val(row.find('td:eq(0)').text());
    $('#custEmail').val(row.find('td:eq(1)').text());
    $('#custPhone').val(row.find('td:eq(2)').text());

    $('#customerForm').slideDown();
});
