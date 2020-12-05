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

export const syncColumns = (colStore) => {
    const columns = {};
    for (const col of colStore.filter(col => col.show).map(col => col.field)) {
        columns[col] = true;
    }
    // console.log(columns);
};

export const tags = writable([]);

export const cols = writable([]);
