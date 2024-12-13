<script>
	const browser = detectBrowser(navigator.userAgent)

	let count  = $state(loadCount());
	const area = $derived(count * count);
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
</script>

<style>
	.large {font-size: 32px;}
</style>

<section>
<h1 class="large">Hello <b>{browser}</b>! </h1>
<input type="number" bind:value={count} />
<cite>
	(by <a href="https://svelte.dev/">Svelte</a> via <a href="https://bun.sh/">Bun!</a>)
</cite>
</section>