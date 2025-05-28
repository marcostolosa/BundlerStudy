const fs = require("fs")

function buildCategories(moduleObj){
    let categories = {small:{}, medium:{}, big: {}};
    for (const [key, module] of Object.entries(moduleObj)) {
        if(module.size === 0){
            continue;
        }
        if(module.size < 10000){
            categories.small[key] = module;
        } else if(module.size >= 10000 && module.size < 50000){
            categories.medium[key] = module;
        } else if(module.size >= 50000){
            categories.big[key] = module;
        }
    }
    return categories;
}

function showQuantityInCategories(categories){
    let quantity = {
        small: Object.keys(categories.small).length,
        medium: Object.keys(categories.medium).length,
        big: Object.keys(categories.big).length
    }
    return quantity;
}

function writeQuantityToFile(Path, Quantity){
    const data = JSON.stringify(Quantity, null, 4);
    fs.writeFileSync(Path, data);
}

module.exports = {showQuantityInCategories, writeQuantityToFile, buildCategories}

