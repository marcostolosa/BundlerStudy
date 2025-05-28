/**
 * return type {sourcemap, 0(no sourcemap), 1(full sourcemap), 2(split/eval sourcemap)}
 * SOURCEMAP LINKS
 * source-map: //# sourceMappingURL=bundle-source-map.js.map
 * nosources-source-map: //# sourceMappingURL=bundle-source-map.js.map
 *
 * INLINE SOURCEMAPS
 * inline-source-map: //# sourceMappingURL=data:application/json;charset=utf-8;base64,<base64string>
 *
 * TODO: eval sourcemaps need to be merged for each module included.
 * eval-source-map: //# sourceMappingURL=data:application/json;charset=utf-8;base64,<base64String>\n//# sourceURL=webpack-internal://"
 * eval-cheap-source-map: //# sourceMappingURL=data:application/json;charset=utf-8;base64,<base64String>\n//# sourceURL=webpack-internal:///
 * eval-cheap-module-source-map: //# sourceMappingURL=data:application/json;charset=utf-8;base64,<base64String>\n//# sourceURL=webpack-internal:///
 *
 * HIDDEN SOURCEMAPS
 * hidden-source-map: hidden at the place: bundle-source-map.js.map
 *
 * !Not sure! ignore for now
 * eval: //# sourceURL=webpack:///./example.coffee?../../node_modules/coffee-loader/dist/cjs.js" ToDo:Check this again.
 */

const axios = require("axios");

async function sourceMapGrabber(sourceFile, url) {
    let inlineSourceMapString =
        "sourceMappingURL=data:application/json;charset=utf-8;base64,";
    // try to parse inline sourcemap
    if (sourceFile.includes(inlineSourceMapString)) {
        // eval sourcemap
        if (sourceFile.includes("\n//# sourceURL=webpack-internal://")) {
            // split document in chunks
            return testEvalSourcemap(sourceFile);
        } else {
            // normal sourcemap
            return testInlineSourcemap(sourceFile);
        }
    } else {
        return testSourcemapReference(sourceFile, url);
    }
}

function isRelativePath(url) {
    return !url.includes("/");
}

function mergeSourcemaps(srcmaps) {
    let mergedSrcMaps = [];
    for (const srcmap of srcmaps) {
        mergedSrcMaps.push(srcmap);
    }
    return mergedSrcMaps;
}

function testInlineSourcemap(sourceFile) {
    let inlineSourceMapString =
        "sourceMappingURL=data:application/json;charset=utf-8;base64,";
    sourceMap = sourceFile.toString().split(inlineSourceMapString)[1];
    sourceMap = sourceMap.split("\n//# sourceURL=webpack-internal://")[0];
    sourceMap = sourceMap.trim();
    try {
        sourceMap = atob(sourceMap);
        sourceMap = JSON.parse(sourceMap);
    } catch (e) {
        return [{}, 0];
    }
    return [sourceMap, 1];
}

function testEvalSourcemap(sourceFile) {
    let res = [];
    let inlineSourceMapString =
        "sourceMappingURL=data:application/json;charset=utf-8;base64,";
    let sourcemaps = sourceFile.toString().split(inlineSourceMapString);
    for (let i = 1; i < sourcemaps.length; i++) {
        const element = sourcemaps[i];
        let tmp = element.split("//# sourceURL=webpack-internal://")[0];
        tmp = tmp.substring(0, tmp.length - 2);
        try {
            tmp = atob(tmp);
            tmp = JSON.parse(tmp);
        } catch (e) {}
        res.push(tmp);
    }
    return [mergeSourcemaps(res), 2];
}

async function testSourcemapReference(sourceFile, url) {
    let sourceMapReference = "//# sourceMappingURL=";
    let sourceMap = "";
    if (sourceFile.includes(sourceMapReference)) {
        sourceMap = sourceFile.toString();
        sourceMap = sourceMap.split(sourceMapReference)[1];
        sourceMap = sourceMap.trim();
        // visit url to grab source map
        try {
            if (isRelativePath(sourceMap)) {
                if (!url.includes("/")) {
                    url = url + "/";
                }
                let lastIndex = url.lastIndexOf("/");
                sourceMap = url.substring(0, lastIndex + 1) + sourceMap;
            }
        } catch (e) {
            return [{}, 0];
        }
    } else {
        // try to find hidden source-map

        sourceMap = url.split("?")[0] + ".map";
    }
    let res;
    try {
        res = await axios.get(sourceMap);
    } catch (error) {
        return [{}, 0];
    }

    if (res.status !== 200 || sourceMap !== res.request.res.responseUrl) {
        return [{}, 0];
    }
    sourceMap = await res.data;
    if (
        typeof sourceMap !== "object" ||
        !("version" in sourceMap) ||
        !("file" in sourceMap)
    ) {
        return [{}, 0];
    }
    return [sourceMap, 1];
}

module.exports = {
    sourceMapGrabber,
    testEvalSourcemap,
    testInlineSourcemap,
    testSourcemapReference,
};
