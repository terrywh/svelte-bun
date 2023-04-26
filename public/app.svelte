<script>
	const browser = detectBrowser(navigator.userAgent)

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

	detectBrowser(navigator.userAgent)
</script>

<style>
	.large {font-size: 32px;}
</style>

<section>
<h1 class="large">Hello <b>{browser}</b>! </h1>
<cite>
	(by <a href="https://svelte.dev/">Svelte</a> via <a href="https://bun.sh/">Bun!</a>)
</cite>
</section>