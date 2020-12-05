// https://github.com/will-wow/contacts/blob/master/app/javascript/src/api.js
// https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/Svelte_stores

import { writable } from 'svelte/store';

const root = `${document.getElementsByTagName(`base`)[0].getAttribute(`href`)}`;

const request = method => async (path, data) => {
    try {
        const response = await fetch(`${root}${path}`, {
            method,
            headers: {
                'Content-Type': `application/json`,
            },
            body: JSON.stringify(data),
        });
        if (response.ok) {
            if (response.headers.get(`Content-Type`).startsWith(`application/json`)) {
                return await response.json();
            } else {
                return await response.text();
            }
        } else {
            throw new Error(response.statusText);
        }
    } catch(error) {
        throw new Error(error);
    }
};

export const api = {
    get: request(`GET`),
    post: request(`POST`),
    put: request(`PUT`),
    delete: request(`DELETE`),
};

let previousColumns = `{}`;
let savingColumns = false;

export const syncColumns = (colStore) => {
    const apiColumns = () => {
        const columns = {};
        for (const col of colStore.filter(col => col.show).map(col => col.field)) {
            columns[col] = true;
        }
        return columns;
    };
    if (previousColumns === `{}`) {
        previousColumns = JSON.stringify(apiColumns());
    } else {
        if (!savingColumns) {
            savingColumns = true;
            setTimeout(async () => {
                const columns = apiColumns();
                if (JSON.stringify(columns) !== previousColumns) {
                    try {
                        await api.post(`config`, {
                            columns,
                        });
                        previousColumns = JSON.stringify(columns);
                    } catch(error) {
                        console.log(error);
                    }
                }
                savingColumns = false;
            }, 500);
        }
    }
};

export const tags = writable([]);

export const cols = writable([]);
