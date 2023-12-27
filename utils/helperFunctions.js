const hasDuplicates = (array) => {
    return new Set(array).size !== array.length;
};

module.exports = { hasDuplicates };