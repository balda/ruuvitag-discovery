'use strict'

const measures = [{
    field: `temperature`,
    label: `Temperature`,
    device_class: `temperature`,
    unit_of_measurement: `°C`,
}, {
    field: `humidity`,
    label: `Humidity`,
    device_class: `humidity`,
    unit_of_measurement: `%`,
}, {
    field: `pressure`,
    label: `Pressure`,
    device_class: `pressure`,
    unit_of_measurement: `hPa`,
    scale: 0.01,
}, {
    field: `battery`,
    label: `Battery`,
    icon: `battery-bluetooth-variant`,
    unit_of_measurement: `mV`,
}, {
    field: `battery_level`,
    label: `Battery Level`,
    device_class: `battery`,
    unit_of_measurement: `%`,
}, {
    field: `accelerationX`,
    label: `Acceleration X`,
    icon: `axis-x-arrow`,
    unit_of_measurement: `mG`,
    required: [`acceleration`],
}, {
    field: `accelerationY`,
    label: `Acceleration Y`,
    icon: `axis-y-arrow`,
    unit_of_measurement: `mG`,
    required: [`acceleration`],
}, {
    field: `accelerationZ`,
    label: `Acceleration Z`,
    icon: `axis-z-arrow`,
    unit_of_measurement: `mG`,
    required: [`acceleration`],
}, {
    field: `rssi`,
    label: `RSSI`,
    device_class: `signal_strength`,
    unit_of_measurement: `dBm`,
}, {
    field: `acceleration`,
    label: `Acceleration`,
    icon: `speedometer`,
    unit_of_measurement: `mG`,
    required: [`accelerationX`, `accelerationY`, `accelerationZ`],
}, {
    field: `equilibrium_vapor_pressure`,
    label: `Equilibrium Vapor Pressure`,
    device_class: `pressure`,
    unit_of_measurement: `hPa`,
    scale: 0.01,
    required: [`temperature`],
}, {
    field: `absolute_humidity`,
    label: `Absolute Humidity`,
    icon: `water`,
    unit_of_measurement: `g/m3`,
    required: [`temperature`, `humidity`],
}, {
    field: `air_density`,
    label: `Air Density`,
    icon: `air-filter`,
    unit_of_measurement: `kg/m3`,
    required: [`temperature`, `humidity`, `pressure`],
}, {
    field: `dew_point`,
    label: `Dew Point`,
    device_class: `temperature`,
    unit_of_measurement: `°C`,
    required: [`temperature`, `humidity`],
}, {
    field: `vapor_pressure_deficit`,
    label: `Vapor Pressure Deficit`,
    device_class: `pressure`,
    unit_of_measurement: `hPa`,
    required: [`temperature`, `humidity`],
}, {
    field: `txPower`,
    label: `Tx Power`,
    device_class: `signal_strength`,
    unit_of_measurement: `dBm`,
}, {
    field: `movementCounter`,
    label: `Movement Counter`,
    // icon: `battery-bluetooth-variant`,
    unit_of_measurement: `count`,
}, {
    field: `measurementSequenceNumber`,
    label: `Measurement Sequence Number`,
    // icon: `battery-bluetooth-variant`,
    unit_of_measurement: `count`,
}]
// .filter(filterMeasures(config.measures))

module.exports = measures
