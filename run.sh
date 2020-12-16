#!/usr/bin/env bashio
set +u

CONFIG_PATH=/data/options.json

HCI_DEVICE_ID=$(jq --raw-output ".hci_device_id" $CONFIG_PATH)

bashio::log.info "Start RuuviTag daemon"

bashio::log.info "Using HCI_DEVICE_ID $HCI_DEVICE_ID"

NOBLE_HCI_DEVICE_ID=$HCI_DEVICE_ID NODE_ENV=production node index.js