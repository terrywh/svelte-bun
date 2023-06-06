import { HttpError } from "../core/server/error";

export default {
    /**
     * 
     * @param {URLSearchParams} query
     * @param {Object} body
     */
    "/hello": async function (method, query, body) {
        const r = {}
        for(const [key, value] of query.entries()) { // each 'entry' is a [key, value] tupple
            r[key] = value;
        }
        return Object.assign(r, body)
    },
    "/error": async function (method, query, body) {
        return new HttpError("failed to do something", 12345, 400, "failed to do something")
    },
    "/chunk": async function (method, query, body) {
        const stream = new ReadableStream({
            type: "direct",
            async pull(controller) {
                for (let i=0;i<100;++i) {
                    controller.write(`event: data\ndata: ${i}\n\n`)
                    controller.flush()
                    await Bun.sleep(1000)
                }
                controller.end()
            },
        })
        return new Response(stream, {
            headers: {
                "content-type": "text/event-stream",
                // "content-type": "application/json",
                "transfer-encoding": "chunked",
            }
        })
    }
}