'use strict'

const measures = [{
    field: `temperature`,
    label: `Temperature`,
    type: `temperature`,
    unit: `°C`,
}, {
    field: `humidity`,
    label: `Humidity`,
    type: `humidity`,
    unit: `%`,
}, {
    field: `pressure`,
    label: `Pressure`,
    type: `pressure`,
    unit: `hPa`,
    scale: 0.01,
}, {
    field: `battery`,
    label: `Battery`,
    icon: `battery-bluetooth-variant`,
    unit: `mV`,
}, {
    field: `battery_level`,
    label: `Battery Level`,
    type: `battery`,
    unit: `%`,
}, {
    field: `accelerationX`,
    label: `Acceleration X`,
    icon: `axis-x-arrow`,
    unit: `mG`,
    required: [`acceleration`],
}, {
    field: `accelerationY`,
    label: `Acceleration Y`,
    icon: `axis-y-arrow`,
    unit: `mG`,
    required: [`acceleration`],
}, {
    field: `accelerationZ`,
    label: `Acceleration Z`,
    icon: `axis-z-arrow`,
    unit: `mG`,
    required: [`acceleration`],
}, {
    field: `rssi`,
    label: `RSSI`,
    type: `signal_strength`,
    unit: `dBm`,
}, {
    field: `acceleration`,
    label: `Acceleration`,
    icon: `speedometer`,
    unit: `mG`,
    required: [`accelerationX`, `accelerationY`, `accelerationZ`],
}, {
    field: `equilibrium_vapor_pressure`,
    label: `Equilibrium Vapor Pressure`,
    type: `pressure`,
    unit: `hPa`,
    scale: 0.01,
    required: [`temperature`],
}, {
    field: `absolute_humidity`,
    label: `Absolute Humidity`,
    icon: `water`,
    unit: `g/m3`,
    required: [`temperature`, `humidity`],
}, {
    field: `air_density`,
    label: `Air Density`,
    icon: `air-filter`,
    unit: `kg/m3`,
    required: [`temperature`, `humidity`, `pressure`],
}, {
    field: `dew_point`,
    label: `Dew Point`,
    type: `temperature`,
    unit: `°C`,
    required: [`temperature`, `humidity`],
}, {
    field: `vapor_pressure_deficit`,
    label: `Vapor Pressure Deficit`,
    type: `pressure`,
    unit: `hPa`,
    required: [`temperature`, `humidity`],
}, {
    field: `txPower`,
    label: `Tx Power`,
    type: `signal_strength`,
    unit: `dBm`,
}, {
    field: `movementCounter`,
    label: `Movement Counter`,
    // icon: `battery-bluetooth-variant`,
    unit: `count`,
}, {
    field: `measurementSequenceNumber`,
    label: `Measurement Sequence Number`,
    // icon: `battery-bluetooth-variant`,
    unit: `count`,
}, {
    field: `samples`,
    label: `History Samples`,
    unit: `count`,
}, {
    field: `frequency`,
    label: `Frequency`,
    unit: `count/min`,
    toFixed: 1,
}, {
    field: `period`,
    label: `Period`,
    unit: `seconds`,
    toFixed: 0,
}]

module.exports = measures
