# RuuviTag Discovery

Discover [RuuviTag Environmental Sensors](https://ruuvi.com/) using a web interface and broadcast measures to configurable targets (MQTT, InfluxDB and Graphite).

## Features

- Discover multiple RuuviTag measures in one page
- Broadcast measures to multiple targets
- Select and configure measures sent to each target
- Add some measures: acceleration, equilibrium vapor pressure, absolute humidity, air density, dew point, vapor pressure deficit, battery level, reception frequency and reception period
- Sampling configuration for aggregations
- Broadcast live or sampled measures

## Roadmap

- [ ] New target: [Home Assistant](https://www.home-assistant.io/hassio/) integration (using [MQTT discovery](https://www.home-assistant.io/docs/mqtt/discovery/))
- [ ] Release an [Hass.io](https://www.home-assistant.io/hassio/) addon
- [ ] Docker image
- [ ] New target: webhook

## Install

### From source

```bash
npm install
npm start
```

Web interface url: http://localhost:8099/

Configuration is save in `/data/` directory (create on first run)

## Configuration

All the configuration is done in the web interface and saved in `/data/config.json` file.

_configuration file format_

```json
{
    "sampling": {
        "history": 100,
        "interval": 10000
    },
    "targets": [
        {
            "type": "[mqtt|influxdb|graphite]",
            "id": "[ID]",
            "enable": "[1|0]",
            "name": "[TARGET_NAME]",
            "interval": "[broadcast interval (seconds)]",
            "tags": {
                "[TAGID]": {
                    "id": "[TAGID]",
                    "measures": {
                        "[MEASURE]": {
                            "label": "[MEASURE_LABEL]",
                            "field": "[MEASURE_FIELD]"
                        }
                    },
                    "name": "[RUUVITAG_NAME]",
                    "field": "[RUUVITAG_FIELD]"
                },
                "...": {
                    ...
                }
            }
        },
        ...
    ]
}
```
