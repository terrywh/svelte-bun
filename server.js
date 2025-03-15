import { VERSION } from "svelte/compiler";

import { pathToFileURL } from "node:url";
import { serve, Glob } from "bun";

const routes = {};

const html = new Glob("**/*.html"); // 入口文件
for await (const file of html.scan("./public")) {
    const path = pathToFileURL(`/${file}`).pathname;
    routes[ path ] = (await import(`./public/${file}`)).default;
}

const js = new Glob("**/*.js"); // 路由方法
for await (const file of js.scan("./route")) {
    const bundle = (await import(`./route/${file}`)).default;
    Object.assign(routes, bundle);
}

serve({
    development: true,
    routes,
});