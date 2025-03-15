import { mount } from "svelte"; // => "/module/svelte.js"
import App from './index.svelte';

const app = mount(App, {
	target: document.body
});

export default app;