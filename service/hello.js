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
    }
}