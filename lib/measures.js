'use strict'

const config = require(':lib/config')

const measures = {
    default: require(':dict/measures'),
    index: {},
}
for (const measure of measures.default) {
    measures.index[`${measure.field}`] = measure
}

measures.find = (field) => {
    if (measures.index[field]) {
        return measures.index[field]
    } else {
        return config.customMeasures.find(measure => measure.field === field)
    }
}

measures.all = () => {
    return [].concat(...measures.default, ...config.customMeasures)
}

module.exports = measures
