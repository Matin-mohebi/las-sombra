module.exports = [
"[project]/src/game/engine.ts [app-ssr] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/src_game_9ca6fbf4._.js",
  "server/chunks/ssr/node_modules_three_build_three_core_b2c80e70.js",
  "server/chunks/ssr/node_modules_three_build_three_module_ac56307a.js",
  "server/chunks/ssr/node_modules_three_examples_jsm_utils_BufferGeometryUtils_2b27591f.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/src/game/engine.ts [app-ssr] (ecmascript)");
    });
});
}),
];