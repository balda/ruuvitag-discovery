// import { writable } from 'svelte/store';

const store = {};

store.tags = (ws, tags = []) => {
    return {
        subscribe(subscription) {
        	ws.addEventListener(`message`, (message) => {
                try {
                    const data = JSON.parse(message.data);
                    if (data.tag) {
                        // console.log(data.tag)
                        const tagIndex = tags.findIndex(tag => tag.id === data.tag.id);
                        tags[tagIndex === -1 ? tags.length : tagIndex] = data.tag;
                        // console.log(`${data.tag.id} - ${data.tag.samples}`);
                        // console.log(data.tag);
                        subscription(tags);
                    }
                } catch(error) {
                    console.log(`STORE: message error`);
                    console.log(error);
                }
        	});
            return () => {
                console.log(`STORE: unsubscribe`);
            };
        },
    };
};

// function storeTags(ws, tags = []) {
//     // console.log(`STORE: create`);
//     // console.log(ws);
//     // const { subscribe, set, update } = writable(0);
//     return {
//         // set(value) {
//         //     console.log(`STORE: value`);
//         //     console.log(value);
//         // },
//         subscribe(subscription) {
//             // console.log(subscription);
//             // console.log(`STORE: subscribe`);
//             // console.log(ws);
//         	// ws.addEventListener(`open`, () => {
//         	// 	console.log(`STORE: ws connected`);
//         	// });
//         	ws.addEventListener(`message`, (message) => {
//                 // console.log(`STORE: message`);
//                 try {
//                     const data = JSON.parse(message.data);
//                     if (data.tag) {
//                         // console.log(data.tag)
//                         const tagIndex = tags.findIndex(tag => tag.id === data.tag.id);
//                         tags[tagIndex === -1 ? tags.length : tagIndex] = data.tag;
//                         // console.log(`${data.tag.id} - ${data.tag.samples}`);
//                         // console.log(data.tag);
//                         subscription(tags);
//                     }
//                 } catch(error) {
//                     console.log(`STORE: message error`);
//                     console.log(error);
//                 }
//         	});
//             return () => {
//                 console.log(`STORE: unsubscribe`);
//             };
//         },
//         // increment: () => update(n => n + 1),
//         // decrement: () => update(n => n - 1),
//         // reset: () => set(0),
//     };
// }

// export default storeTags;
// export const tags = storeTags;
export default store;
