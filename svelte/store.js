// import { writable } from 'svelte/store';

// https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/Svelte_stores

const store = (ws, tags = []) => {
    return {
        subscribe(subscription) {
        	ws.addEventListener(`message`, (message) => {
                try {
                    const data = JSON.parse(message.data);
                    if (data.tag) {
                        const tagIndex = tags.findIndex(tag => tag.id === data.tag.id);
                        tags[tagIndex === -1 ? tags.length : tagIndex] = data.tag;
                        subscription(tags);
                    }
                } catch(error) {
                    // console.log(`STORE: message error`);
                    console.log(error);
                }
        	});
            return () => {
                // console.log(`STORE: unsubscribe`);
            };
        },
    };
};

// export default storeTags;
// export const tags = storeTags;
export default store;
