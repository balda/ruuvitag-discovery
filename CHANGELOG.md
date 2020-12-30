# Changelog

## [Unreleased]

## [0.2.7] - 2020-12-30
- New target: Home Assistant (API) (#2)
- Fix target measures accuracy and scale (pressure is properly sent in `hPa`)
- Custom measures doc

## [0.2.6] - 2020-12-20
- Add custom measures as experimental feature (#7, #11)

## [0.2.5] - 2020-12-19
- Fix missing build

## [0.2.4] - 2020-12-19
- Display measures value in real time in target popup (discovery page) and in targets list
- Add reading Home Assistant options file to allow change of `NOBLE_HCI_DEVICE_ID` variable
- Update docs about `NOBLE_HCI_DEVICE_ID`
- Add `noble` warnings in logs

## [0.2.3] - 2020-12-12
- Bugfixes
- More server log options (configurable in the UI)

## [0.2.2] - 2020-12-12
- Server: port can be changed and add error handler (#27)
- Tag detail popup: add name if defined (#22)
- Rename tag: add a button to empty name
- Add momentjs and bootstrap map file (#24)

## [0.2.1] - 2020-12-06
- Fix WebSocket with ssl

## [0.2.0] - 2020-12-06
- Rewrite frontend with Svelte
- Live refresh for tag measures in all the interface (#9)
- Measure unit displayed in a tooltip on discover page (#10)
- Don't crash target error (#13)
- Include dependencies `bootstrap`, `momentjs` and `font-awesome` (#20)

## [0.1.14] - 2020-11-27
- Update hassioaddons base image to version `8.0.6`
- Fix python alpine install (no more `python` package, only `python3`) (#19)

## [0.1.13] - 2020-07-04
- New build (no more "[supervisor.docker.addon] Can't build ...")

## [0.1.12] - 2020-07-03
- Home Assistant MQTT: no more Ruuvitag Discovery restart needed after Home Assistant restart (#12)

## [0.1.11] - 2020-05-17
- Add RuuviTag `mac` address (#4)
- Home Assistant MQTT: catch error when present `undefined` tag (#5)

## [0.1.10] - 2020-05-17
- Fix measures precision (#1)

## [0.1.9] - 2020-05-10
- Add screenshots in doc
- Selected columns are now saved in config

## [0.1.8] - 2020-05-10
- Add target popup detail on discovery page
- Add tag id tooltip on `Name` column when tag is renamed

## [0.1.7] - 2020-05-09
- RuuviTags can be renamed in discovery list
- Update Font Awesome icons
- Add a close button to modal

## [0.1.6] - 2019-02-22
### Added
- Discovery panel: add tag informations popup
- Discovery panel: select displayed columns (more available columns)
- Home Assistant target: add panel icon

## [0.1.5] - 2019-02-15
### Added
- Home Assistant: present tags every minute (on send)
- Add font-awesome to repository (fix safari cross origin bug)

## [0.1.4] - 2019-02-09
### Added
- Fix Hass.io config (not fixed in [0.1.3])

## [0.1.2] - 2019-02-09
### Added
- Add configuration export / import

## [0.1.1] - 2019-02-06
### Added
- Add battery level configuration

## [0.1.0] - 2019-02-03
### Added
- [Hass.io](https://www.home-assistant.io/hassio/) add-on

## [0.0.2] - 2019-02-02
### Added
- New Target: [Home Assistant](https://www.home-assistant.io/hassio/) (using [MQTT discovery](https://www.home-assistant.io/docs/mqtt/discovery/) integration)

## 0.0.1 - 2020-02-01

First release

[Unreleased]: https://github.com/balda/ruuvitag-discovery/compare/0.2.7...HEAD
[0.2.7]: https://github.com/balda/ruuvitag-discovery/compare/0.2.6...0.2.7
[0.2.6]: https://github.com/balda/ruuvitag-discovery/compare/0.2.5...0.2.6
[0.2.5]: https://github.com/balda/ruuvitag-discovery/compare/0.2.4...0.2.5
[0.2.4]: https://github.com/balda/ruuvitag-discovery/compare/0.2.3...0.2.4
[0.2.3]: https://github.com/balda/ruuvitag-discovery/compare/0.2.2...0.2.3
[0.2.2]: https://github.com/balda/ruuvitag-discovery/compare/0.2.1...0.2.2
[0.2.1]: https://github.com/balda/ruuvitag-discovery/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/balda/ruuvitag-discovery/compare/0.1.14...0.2.0
[0.1.14]: https://github.com/balda/ruuvitag-discovery/compare/0.1.13...0.1.14
[0.1.13]: https://github.com/balda/ruuvitag-discovery/compare/0.1.12...0.1.13
[0.1.12]: https://github.com/balda/ruuvitag-discovery/compare/0.1.11...0.1.12
[0.1.11]: https://github.com/balda/ruuvitag-discovery/compare/0.1.10...0.1.11
[0.1.10]: https://github.com/balda/ruuvitag-discovery/compare/0.1.9...0.1.10
[0.1.9]: https://github.com/balda/ruuvitag-discovery/compare/0.1.8...0.1.9
[0.1.8]: https://github.com/balda/ruuvitag-discovery/compare/0.1.7...0.1.8
[0.1.7]: https://github.com/balda/ruuvitag-discovery/compare/0.1.6...0.1.7
[0.1.6]: https://github.com/balda/ruuvitag-discovery/compare/0.1.5...0.1.6
[0.1.5]: https://github.com/balda/ruuvitag-discovery/compare/0.1.4...0.1.5
[0.1.4]: https://github.com/balda/ruuvitag-discovery/compare/0.1.3...0.1.4
[0.1.3]: https://github.com/balda/ruuvitag-discovery/compare/0.1.2...0.1.3
[0.1.2]: https://github.com/balda/ruuvitag-discovery/compare/0.1.1...0.1.2
[0.1.1]: https://github.com/balda/ruuvitag-discovery/compare/0.1.0...0.1.1
[0.1.0]: https://github.com/balda/ruuvitag-discovery/compare/0.0.2...0.1.0
[0.0.2]: https://github.com/balda/ruuvitag-discovery/compare/0.0.1...0.0.2
