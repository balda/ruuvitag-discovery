`use strict`

const parseDataFormat3 = function(manufacturerDataString){
    let humidityStart      = 6;
    let humidityEnd        = 8;
    let temperatureStart   = 8;
    let temperatureEnd     = 12;
    let pressureStart      = 12;
    let pressureEnd        = 16;
    let accelerationXStart = 16;
    let accelerationXEnd   = 20;
    let accelerationYStart = 20;
    let accelerationYEnd   = 24;
    let accelerationZStart = 24;
    let accelerationZEnd   = 28;
    let batteryStart       = 28;
    let batteryEnd         = 32;

    let robject = {};

    let humidity = manufacturerDataString.substring(humidityStart, humidityEnd);
    humidity = parseInt(humidity, 16);
    humidity/= 2; //scale
    robject.humidity = humidity;

    let temperatureString = manufacturerDataString.substring(temperatureStart, temperatureEnd);
    let temperature = parseInt(temperatureString.substring(0, 2), 16);  //Full degrees
    temperature += parseInt(temperatureString.substring(2, 4), 16)/100; //Decimals
    if(temperature > 128){           // Ruuvi format, sign bit + value
    temperature = temperature-128;
    temperature = 0 - temperature;
    }
    robject.temperature = +temperature.toFixed(2); // Round to 2 decimals, format as a number

    let pressure = parseInt(manufacturerDataString.substring(pressureStart, pressureEnd), 16);  // uint16_t pascals
    pressure += 50000; //Ruuvi format
    robject.pressure = pressure;

    let accelerationX = parseInt(manufacturerDataString.substring(accelerationXStart, accelerationXEnd), 16);  // milli-g
    if(accelerationX > 32767){ accelerationX -= 65536;}  //two's complement

    let accelerationY = parseInt(manufacturerDataString.substring(accelerationYStart, accelerationYEnd), 16);  // milli-g
    if(accelerationY > 32767){ accelerationY -= 65536;}  //two's complement

    let accelerationZ = parseInt(manufacturerDataString.substring(accelerationZStart, accelerationZEnd), 16);  // milli-g
    if(accelerationZ > 32767){ accelerationZ -= 65536;}  //two's complement

    robject.accelerationX = accelerationX;
    robject.accelerationY = accelerationY;
    robject.accelerationZ = accelerationZ;

    let battery = parseInt(manufacturerDataString.substring(batteryStart, batteryEnd), 16);  // milli-g
    robject.battery = battery;

    return robject;
}

const parseDataFormat5 = function(data){
    let robject = {};

    let temperature = (data[3] << 8 | data[4] & 0xFF);
    if(temperature > 32767) {
      temperature -= 65534;
    }
    robject.temperature = temperature / 200.0;

    robject.humidity = ((data[5] & 0xFF) << 8 | data[6] & 0xFF) / 400.0;
    robject.pressure = ((data[7] & 0xFF) << 8 | data[8] & 0xFF) + 50000;

    let accelerationX = (data[9] << 8 | data[10] & 0xFF);
    if (accelerationX > 32767) accelerationX -= 65536;  //two's complement
    robject.accelerationX = accelerationX;

    let accelerationY = (data[11] << 8 | data[12] & 0xFF);
    if (accelerationY > 32767) accelerationY -= 65536;  //two's complement
    robject.accelerationY = accelerationY;

    let accelerationZ = (data[13] << 8 | data[14] & 0xFF);
    if (accelerationZ > 32767) accelerationZ -= 65536;  //two's complement
    robject.accelerationZ = accelerationZ;

    let powerInfo = (data[15] & 0xFF) << 8 | data[16] & 0xFF;
    robject.battery = (powerInfo >>> 5) + 1600;
    robject.txPower = (powerInfo & 0b11111) * 2 - 40;
    robject.movementCounter = data[17] & 0xFF;
    robject.measurementSequenceNumber = (data[18] & 0xFF) << 8 | data[19] & 0xFF;

    return robject;
}

const dataformat = {
    "_3": (buffer) => parseDataFormat3(buffer.toString('hex')),
    "_5": (buffer) => parseDataFormat5(buffer.toString('hex')),
}

const decode = (data) => {
    return dataformat[`_${data[2]}`](data)
}

module.exports = decode
