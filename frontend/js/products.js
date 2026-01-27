// native JS, async/await, try/catch

import { getProducts, addProduct, updateProduct, deleteProduct } from "./services/product.service.js";
import { displayRow } from "./utils/table.util.js";
import { logError } from "./utils/error.util.js";

const productTable = document.querySelector('#productTable');
const productForm = document.querySelector('#productForm');
const addProductBtn = document.querySelector('#addProductBtn');
const cancelProductBtn = document.querySelector('#cancelProduct');
const saveProductBtn = document.querySelector('#saveProduct');

// Load and display products on page load
async function loadProducts() {

    try {
        const data = await getProducts();

        data.forEach(p => {
            productTable.insertAdjacentHTML(
                'beforeend',
                displayRow({
                    entity: p,
                    fields: ['product_name', 'unit_price', 'tax_rate'],
                    idKey: 'product_id',
                    entityName: 'product'
                })
            );
        });
    }
    catch (err) {
        logError(err, 'get-product');
    }
}

loadProducts();

// Save product (add or update)
saveProductBtn.addEventListener('click', async function () {

    const product = {
        product_name: document.querySelector('#prodName').value,
        unit_price: document.querySelector('#prodPrice').value,
        tax_rate: document.querySelector('#prodTax').value.replace('%', '')
    };

    try {
        if (editingProductId) {
            const updated = await updateProduct(editingProductId, product);

            const row = productTable.querySelector(`tr[data-id="${editingProductId}"]`);

            row.outerHTML = displayRow({
                entity: updated,
                fields: ['product_name', 'unit_price', 'tax_rate'],
                idKey: 'product_id',
                entityName: 'product'
            });

            editingProductId = null;
        }
        else {
            const created = await addProduct(product);
            productTable.insertAdjacentHTML(
                'beforeend',
                displayRow({
                    entity: created,
                    fields: ['product_name', 'unit_price', 'tax_rate'],
                    idKey: 'product_id',
                    entityName: 'product'
                })
            );
        }

        $(productForm).slideUp();
    } catch (err) {
        logError(err, 'save-product');
    }
});

// Delete product on delete button click
productTable.addEventListener('click', async function (e) {
    const deleteBtn = e.target.closest('.delete-product');
    if (!deleteBtn) return;

    const id = deleteBtn.dataset.id;
    if (!id) return;

    try {
        await deleteProduct(id);
        deleteBtn.closest('tr').remove();
    } catch (err) {
        logError(err, 'delete-product');
    }
});

// Open add form on add button click
addProductBtn.addEventListener('click', () => {
    $(productForm).slideDown();
});

// Cancel button hides the form
cancelProductBtn.addEventListener('click', () => {
    $(productForm).slideUp();
});


// Open edit form on edit button click
let editingProductId = null;

productTable.addEventListener('click', function (e) {

    const editBtn = e.target.closest('.edit-product');
    if (!editBtn) return;

    editingProductId = editBtn.dataset.id;

    const row = editBtn.closest('tr');
    const cells = row.querySelectorAll('td');

    document.querySelector('#prodName').value = cells[0].textContent;
    document.querySelector('#prodPrice').value = cells[1].textContent;
    document.querySelector('#prodTax').value = cells[2].textContent;

    $(productForm).slideDown();
});
