<script>
    import { tags, cols } from './store/api.js';
    import { config, addon, ruuvi } from './store/config.js';
    import { targets } from './store/targets.js';
    import { dictTargets, dictMeasures } from './store/dict.js';
    import { Container, Row, Col } from "sveltestrap";
    import PanelDiscover from './Discover/Panel.svelte';
    import PanelTargets from './Targets/Panel.svelte';
    import PanelConfig from './Config/Panel.svelte';

    let panel = `discover`;

    const ws = new WebSocket(`ws${document.URL.substring(4,5) === `s` ? `s` : ``}://${document.URL.split(`//`).splice(1).join(`//`)}`);
    // ws.addEventListener(`open`, () => { console.log(`ws connected`); });
    ws.addEventListener(`message`, (message) => {
        try {
            const data = JSON.parse(message.data);
            if (data.tag) {
                const tagIndex = $tags.findIndex(tag => tag.id === data.tag.id);
                $tags[tagIndex === -1 ? $tags.length : tagIndex] = data.tag;
            }
            if (data.addon) {
                // console.log(data);
                $addon = data.addon;
            }
            if (data.config) {
                if (data.config.sampling) {
                    data.config.sampling.history = 1 * data.config.sampling.history;
                    data.config.sampling.interval = 1 * data.config.sampling.interval;
                    $config.sampling = data.config.sampling;
                }
                if (data.config.battery) {
                    data.config.battery.min = 1 * data.config.battery.min;
                    data.config.battery.max = 1 * data.config.battery.max;
                    $config.battery = data.config.battery;
                }
                if (data.config.ruuvitags) {
                    $config.ruuvitags = data.config.ruuvitags;
                }
                if (data.config.columns) {
                    $config.columns = data.config.columns;
                }
                if (data.config.customMeasures) {
                    $config.customMeasures = data.config.customMeasures.map((customMeasure, id) => {
                        customMeasure.id = id;
                        return customMeasure;
                    });
                }
                if (data.config.log) {
                    $config.log = data.config.log;
                }
                if (data.config.targets) {
                    $targets = data.config.targets;
                }
            }
            if (data.measures) {
                $dictMeasures = data.measures.concat(...$config.customMeasures);
                $cols = [{
                    label: `ID`,
                    field: `id`,
                    class: `text-left`,
                    render: `text`,
                    show: $config.columns ? $config.columns.id : true,
                }, {
                    label: `Mac Address`,
                    field: `mac`,
                    class: `text-left`,
                    render: `text`,
                    show: $config.columns ? $config.columns.mac : true,
                }, {
                    label: `Name`,
                    field: `name`,
                    class: `text-left`,
                    render: `name`,
                    show: $config.columns ? $config.columns.name : true,
                }].concat(...$dictMeasures.map(measure => {
                    measure.render = `measure`;
                    measure.show = $config.columns ? $config.columns[measure.field] : measure.required === undefined;
                    return measure;
                }), {
                    label: `Last seen`,
                    field: `ts`,
                    render: `date`,
                    show: true,
                });
            }
            if (data.targets) {
                $dictTargets = data.targets;
            }
            // if (data.error) {
            //     console.log(data.error);
            // }
        } catch(error) {
            console.log(error);
        }
    });
</script>

<main>
    <Container fluid id="page">
        <Row class="app-bgcolor" id="header">
            <Col xs="8" class="p-3 pl-4">
                <span class="mr-4">{$addon.name}</span>
                <a on:click|preventDefault={() => {panel = `discover`}} class="mr-4 text-white text-decoration-none" href="/">
                    <i class="fab fa-bluetooth fa-sm"></i>
                    <small class="ml-1 {panel === `discover` ? `font-weight-bolder` : `font-weight-lighter`}">
                        Discover
                    </small>
                </a>
                <a on:click|preventDefault={() => {panel = `targets`}} class="mr-4 text-white text-decoration-none" href="/">
                    <i class="fas fa-database fa-sm"></i>
                    <small class="ml-1 {panel === `targets` ? `font-weight-bolder` : `font-weight-lighter`}">
                        Targets
                    </small>
                </a>
                <a on:click|preventDefault={() => {panel = `config`}} class="mr-4 text-white text-decoration-none" href="/">
                    <i class="fas fa-cog fa-sm"></i>
                    <small class="ml-1 {panel === `config` ? `font-weight-bolder` : `font-weight-lighter`}">
                        Configuration
                    </small>
                </a>
            </Col>
            <Col xs="4" class="m-auto pr-4">
                <div class="float-right">
                    <small>
                        <em>
                            <a class="text-white font-weight-lighter text-decoration-none" href="{$addon.url}/blob/master/CHANGELOG.md" target="_blank">
                                v{$addon.version}
                            </a>
                        </em>
                    </small>
                    <a class="ml-2 text-white" href="{$addon.url}" target="_blank">
                        <i class="fab fa-github fa-sm"></i>
                    </a>
                    <a class="ml-1 text-white" href="https://ruuvi.com/" target="_blank">
                        {@html ruuvi}
                    </a>
                </div>
            </Col>
        </Row>
        <div class="mb-4">
            {#if panel === `discover`}
                <PanelDiscover />
            {/if}
            {#if panel === `targets`}
                <PanelTargets />
            {/if}
            {#if panel === `config`}
                <PanelConfig />
            {/if}
        </div>
    </Container>
</main>
