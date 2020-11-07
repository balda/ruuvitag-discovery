const post = (url, data) => {
    return fetch(`${url}`, {
        method: `POST`,
        body: JSON.stringify(data),
        headers: {
            'Content-Type': `application/json`
        }
    });
};

export default post;
