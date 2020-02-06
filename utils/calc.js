'use strict'

const precision = (val) => {
    return Math.round(val * 100) / 100
}

const acceleration = (data) => {
    data.acceleration = precision(Math.abs(data.accelerationX) + Math.abs(data.accelerationY) + Math.abs(data.accelerationZ))
}

/**
 * Calculates the equilibrium vapor pressure of water
 *
 * @param temperature Temperature in Celsius
 * @return The vapor pressure in Pa
 */
const equilibriumVaporPressure = (data) => {
    if (data.temperature !== 0 && !data.temperature) {
        return null
    }
    data.equilibrium_vapor_pressure = precision(611.2 * Math.exp(17.67 * data.temperature / (243.5 + data.temperature)))
}

/**
 * Calculates the absolute humidity
 *
 * @param temperature Temperature in Celsius
 * @param humidity Relative humidity % (range 0-100)
 * @return The absolute humidity in g/m^3
 */
const absoluteHumidity = (data) => {
    if ((data.temperature !== 0 && !data.temperature) || !data.humidity || !data.equilibrium_vapor_pressure) {
        return null
    }
    data.absolute_humidity = precision(data.equilibrium_vapor_pressure * data.humidity * 0.021674 / (273.15 + data.temperature))
}

/**
 * Calculates the air density
 *
 * @param temperature Temperature in Celsius
 * @param humidity Relative humidity % (range 0-100)
 * @param pressure Pressure in pa
 * @return The air density in kg/m^3
 */
const airDensity = (data) => {
    if ((data.temperature !== 0 && !data.temperature) || !data.humidity || !data.pressure || !data.equilibrium_vapor_pressure) {
        return null
    }
    data.air_density = precision(1.2929 * 273.15 / (data.temperature + 273.15) * (data.pressure - 0.3783 * data.humidity / 100 * data.equilibrium_vapor_pressure) / 101300)
}

/**
 * Calculates the dew point
 *
 * @param temperature Temperature in Celsius
 * @param humidity Relative humidity % (range 0-100)
 * @return The dew point in Celsius
 */
const dewPoint = (data) => {
    if ((data.temperature !== 0 && !data.temperature) || !data.humidity || !data.equilibrium_vapor_pressure) {
        return null
    }
    const v = Math.log(data.humidity / 100 * data.equilibrium_vapor_pressure / 611.2)
    data.dew_point = precision(-243.5 * v / (v - 17.67))
}

/**
 * Calculates the vapor-pressure deficit
 *
 * @param temperature Temperature in Celsius
 * @param humidity Relative humidity % (range 0-100)
 * @return vapor-pressure deficit (0-20) in hPa
 */
const vaporPressureDeficit = (data) => {
    if ((data.temperature !== 0 && !data.temperature) || !data.humidity) {
        return null
    }
    const ew = Math.exp(13.7 - 5120 / (273.15 + data.temperature)) * 1000
    data.vapor_pressure_deficit = precision(ew - data.humidity / 100 * ew)
}

const batteryLevel = (data, config) => {
    data.battery_level = Math.round((data.battery - config.battery.min) * 100 / (config.battery.max - config.battery.min))
    data.battery_level = Math.max(1, data.battery_level)
    data.battery_level = Math.min(100, data.battery_level)
}

const calc = (data, config) => {
    batteryLevel(data, config)
    equilibriumVaporPressure(data)
    dewPoint(data)
    airDensity(data)
    absoluteHumidity(data)
    acceleration(data)
    vaporPressureDeficit(data)
}

module.exports = calc
