<script>
	import { DEV } from "esm-env";
	const browser = detectBrowser(navigator.userAgent)

	let count = $state(loadCount());
	let version = $state({
		svelte: "",
		bun: "",
	});
	$effect(() => {
		sessionStorage.setItem("count", count)
	})

	function detectBrowser(ua) {
		let name;
		
		if(ua.match(/chrome|chromium|crios/i)){
			name = "Chrome";
		} else if(ua.match(/firefox|fxios/i)){
			name = "Firefox";
		} else if(ua.match(/safari/i)){
			name = "Safari";
		} else if(ua.match(/opr\//i)){
			name = "Opera";
		} else if(ua.match(/edg/i)){
			name = "Edge";
		} else {
			name = "<other>";
		}
		return name;
	}
	function loadCount() {
		const count = sessionStorage.getItem("count")
		return count ? parseInt(count) : 1
	}
	async function loadVersion() {
		const rsp = await fetch("/version");
		return await rsp.json();
	}
	loadVersion().then(v => { Object.assign(version, v); });


</script>

<style>
	.large {font-size: 32px;}
</style>

<section>
<h1 class="large">Hello <b>{browser}</b>! </h1>
<div>
	SessionStorage: <input type="number" bind:value={count} />
</div>
<cite>
	(by <a href="https://svelte.dev/">Svelte/{version.svelte}</a> via <a href="https://bun.sh/">Bun/{version.bun}!</a> on a <strong>{DEV ? "development" : "production"}</strong> server)
</cite>
</section>