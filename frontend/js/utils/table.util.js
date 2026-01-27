export function displayRow({
    entity,
    fields,
    idKey = 'id',
    entityName
}) {
    const id = entity[idKey];

    const cells = fields.map(field =>
        `<td>${entity[field] ?? ''}</td>`
    ).join('');

    return `
        <tr data-id="${id}" data-entity="${entityName}">
            ${cells}
            <td>
                <button class="btn btn-sm btn-primary edit-${entityName.toLowerCase()}"
                        data-id="${id}">
                    Edit
                </button>
                <button class="btn btn-sm btn-danger delete-${entityName.toLowerCase()}"
                        data-id="${id}">
                    Delete
                </button>
            </td>
        </tr>
    `;
}