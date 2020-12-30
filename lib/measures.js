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

measures.update = (data) => {
    return data.map(measure => {
        const measureConfig = measures.find(measure.measure)
        if (measureConfig) {
            try {
                measure.value = measure.value * (measureConfig.scale || 1)
                measure.value = value.toFixed(measureConfig.accuracy)
            } catch(error) {}
        }
        return measure
    })
}

module.exports = measures
