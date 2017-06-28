module.exports = async function(error) {
    assert.isAbove(error.message.search('of gas'), -1, 'Out of gas error must be returned');
}
