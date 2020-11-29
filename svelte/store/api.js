// https://github.com/will-wow/contacts/blob/master/app/javascript/src/api.js

import { writable } from 'svelte/store';

const request = method => async (url, data) => {
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': `application/json`,
            },
            body: JSON.stringify(data),
        });
        if (response.ok) {
            if (response.statusText === `OK`) {
                return await response.text();
            } else {
                return await response.json();
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

export const root = writable(``);
