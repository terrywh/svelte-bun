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
    }
}