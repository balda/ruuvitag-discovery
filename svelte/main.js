import App from './App.svelte';

const root = document.getElementsByTagName(`base`)[0].getAttribute(`href`);
const ws = new WebSocket(`ws://${document.URL.split(`//`).splice(1).join(`//`)}`);

const ruuvi = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 999.56 1200"><defs><style>.a{fill:#fff;}</style></defs><path class="a" d="M499.59,2C223.56,2-.22,225.81-.25,501.95S223.46,1002,499.48,1002,999.23,778.26,999.32,502.16C999.78,226.42,776.72,2.51,501.1,2.05h-1.51M603,829.42c-174.61,0-316.64-140.69-318.36-315.37a216.85,216.85,0,0,0,70.71,11.63c121.74,0,220.43-98.72,220.44-220.51A220.6,220.6,0,0,0,547.46,197,328.75,328.75,0,0,1,603,191.8c175.87,0,318.44,142.63,318.44,318.58S778.86,829,603,829"/></svg>`; //  width="16" height="16"

const app = new App({
	target: document.body,
	props: {
		ruuvi,
		root,
		ws,
	}
});

export default app;
