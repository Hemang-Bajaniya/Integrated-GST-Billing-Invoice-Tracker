// ---------- Topics: CRUD Operations, Async/Await, Error Handling, DOM Manipulation ----------

import { logError } from "./error.util.js";
import { displayRow } from "./table.util.js";

// Get Data and Display in Table
export async function loadTable({
    api,
    tableSelector,
    fields,
    idKey,
    entityName
}) {
    try {
        const data = await api.getAll();

        const table = document.querySelector(tableSelector);

        data.forEach(item => {
            table.insertAdjacentHTML(
                'beforeend',
                displayRow({
                    entity: item,
                    fields,
                    idKey,
                    entityName
                })
            );
        });
    } catch (err) {
        logError(err, `get-${entityName}`);
    }
}

// Save (Add or Update) Entity using entity API
// Also updates the table display
export async function saveEntity({
    api,
    entity,
    editingId,
    tableSelector,
    fields,
    idKey,
    entityName
}) {
    try {
        if (editingId) {
            await api.update(editingId, entity);

            const row = document.querySelector(
                `${tableSelector} tr[data-id="${editingId}"]`
            );

            row.insertAdjacentHTML(
                'afterend',
                displayRow({
                    entity,
                    fields,
                    idKey,
                    entityName
                })
            );

            row.remove();
        } else {
            const created = await api.add(entity);
            document.querySelector(tableSelector)
                .insertAdjacentHTML(
                    'beforeend',
                    displayRow({
                        entity,
                        fields,
                        idKey,
                        entityName
                    })
                );
        }
    } catch (err) {
        logError(err, `save-${entityName}`);
    }
}

// Delete Entity using entity API
// Also removes the row from the table display
export async function deleteEntity(api, id, row, entityName) {
    try {
        await api.delete(id);
        row.remove();
    } catch (err) {
        logError(err, `delete-${entityName}`);
    }
}
