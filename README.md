# svelte-bun
   compile svelte/v5 component on the fly without bundling.

    $ curl -fsSL https://bun.sh/install | bash
    $ source ~/.bashrc
    $ git clone --depth 1 https://github.com/terrywh/svelte-bun.git
    $ cd svelte-bun
    $ bun install
    $ bun run dev

![svelte-bun](./README.png)

## svelte/component
Add a component using `.svelte` as file extension, and import it.
> see `public/index.js` and `public/index.svelte`;

## esm/module
Install a module using `bun install` and import it from `/module/xxx.js` (auto rewrite support in '*.svelte.js','*.svelte' files).
> see `sbin/server.js`, `public/index.js`, `public/index.svelte`;

# restful
Add a service using `.js` and export the handler, import it as the handler parameter of `createRestfulServer()`.
> see `service/hello.js` and `sbin/server.js`



