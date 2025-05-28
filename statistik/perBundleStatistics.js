const fs = require("fs")
function perBundleSpacePerCategory(categories, path){
    let fractions = addUpDistribution(categories);
    let obj = prepareForStatistic(fractions);
    writeOutLabelsAndMagnitude(obj, path)
}

function addUpDistribution(categories){
    let fractions = {small:0, medium:0, big:0};
    for (const [category, stats] of Object.entries(categories)) {
        for (const [key, module] of Object.entries(stats)) {
            fractions[category] += module.size;
        }
    }
    return fractions;
}

function prepareForStatistic(fractions){
    let labels = [];
    let magnitude = [];
    for (const [key, value] of Object.entries(fractions)) {
        labels.push(key);
        magnitude.push(value);
    }
    return {label:labels, magnitudes:magnitude};
}

function prepareSCCsForStatistic(obj){
    let labels = [];
    let magnitude = [];
    labels.push("firstParty");
    magnitude.push(obj["FirstParty"]);
    for(const [key,value] of Object.entries(obj["ThirdParty"])){
        labels.push(key);
        magnitude.push(value)
    }
    return {label:labels, magnitudes:magnitude};
}

function divideSCCsIntoThirdParty(obj){
    let divide = {firstParty:{}, thirdParty:{}}
    for (const root of Object.keys(obj)) {
        if(root.includes("node_modules")){
            divide["thirdParty"][shortenPath(root)] = obj[root];
        } else {
            divide["firstParty"][shortenPath(root)] = obj[root];
        }
    }
    return divide;
}

function combineFirstParty(divide){
    let combinedFirstParty = {firstParty:{}, thirdParty: {}};
    combinedFirstParty["thirdParty"] = divide["thirdParty"];
    let combinedMagnitude = 0;
    let numberOfModules = 0;
    for (const [root, magnitude] of Object.entries(divide["firstParty"])) {
        combinedMagnitude += magnitude.size;
        numberOfModules++;
    }
    combinedFirstParty["firstParty"]["numberOfModules"] = numberOfModules;
    combinedFirstParty["firstParty"]["moduleSize"] = combinedMagnitude;
    return combinedFirstParty;
}

function combineSecondParty(combinedFirstParty){
    let combinedThirdParty = {firstParty:{}, thirdParty: {}}
    combinedThirdParty["firstParty"] = combinedFirstParty["firstParty"];
    let newThirdParty = {};
    for (const [root, size] of Object.entries(combinedFirstParty["thirdParty"])) {
        // extract first part of path
        let moduleName = root.split("/", 2)[1];
        if(!newThirdParty[moduleName]){
            newThirdParty[moduleName] = 0;
        }
        newThirdParty[moduleName] += size.size;
    }
    combinedThirdParty["thirdParty"] = newThirdParty;
    return combinedThirdParty;


}

function shortenPath(path){
    let withoutModulePath = path.replaceAll("node_modules", "");
    let withoutWeiredPathTraversal = withoutModulePath.replaceAll("../","");
    let withoutWeiredDotSnake = withoutWeiredPathTraversal.replaceAll("...", "");
    let withoutDoubleSlash = withoutWeiredDotSnake.replaceAll("//", "/");
    return withoutDoubleSlash;
}

function writeOutLabelsAndMagnitude(obj, path){
    let data = JSON.stringify(obj,null, 4);
    fs.writeFileSync(path, data);
}

function sumUpSCCsSizes(SCCs){
    let roots = {};
    for (const [root, deps] of Object.entries(SCCs)) {
        roots[root] = {size:0};
        for (const [key,obj] of Object.entries(deps)) {
            roots[root].size += obj.size;
        }
    }
    return roots;
}

module.exports = {perBundleSpacePerCategory, sumUpSCCsSizes, prepareSCCsForStatistic, divideSCCsIntoThirdParty, combineFirstParty, combineSecondParty, prepareForStatistic}