function aggregateQuantityInCategory(quantities, oldQuantity){
    oldQuantity.small += quantities.small;
    oldQuantity.medium += quantities.medium;
    oldQuantity.big += quantities.big;
}

module.exports = aggregateQuantityInCategory;
