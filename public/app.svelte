<script>
	const browser = detectBrowser(navigator.userAgent)

	function detectBrowser(ua) {
		let name;
		
		if(ua.match(/chrome|chromium|crios/i)){
			name = "chrome";
		} else if(ua.match(/firefox|fxios/i)){
			name = "firefox";
		} else if(ua.match(/safari/i)){
			name = "safari";
		} else if(ua.match(/opr\//i)){
			name = "opera";
		} else if(ua.match(/edg/i)){
			name = "edge";
		} else {
			name = "other";
		}
		console.log(name)
		return name;
	}

	detectBrowser(navigator.userAgent)
</script>

<style>
	.large {font-size: 128px;}
</style>

<h1 class="large">Hello from <b>{browser}</b> via <a href="https://bun.sh/">Bun!</a></h1>