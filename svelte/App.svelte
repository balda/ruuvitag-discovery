<script>
    import { tags, cols } from './store/api.js';
    import { config } from './store/config.js';
    import { targets } from './store/targets.js';
    import { dictTargets, dictMeasures } from './store/dict.js';
    import { Container, Row, Col } from "sveltestrap";
    import PanelDiscover from './Discover/Panel.svelte';
    import PanelTargets from './Targets/Panel.svelte';
    import PanelConfig from './Config/Panel.svelte';

    const ruuvi = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 999.56 1200"><defs><style>.a{fill:#fff;}</style></defs><path class="a" d="M499.59,2C223.56,2-.22,225.81-.25,501.95S223.46,1002,499.48,1002,999.23,778.26,999.32,502.16C999.78,226.42,776.72,2.51,501.1,2.05h-1.51M603,829.42c-174.61,0-316.64-140.69-318.36-315.37a216.85,216.85,0,0,0,70.71,11.63c121.74,0,220.43-98.72,220.44-220.51A220.6,220.6,0,0,0,547.46,197,328.75,328.75,0,0,1,603,191.8c175.87,0,318.44,142.63,318.44,318.58S778.86,829,603,829"/></svg>`; //  width="16" height="16"
    let addon = {
        name: `RuuviTags Discovery`,
        version: `0.0.1`,
        url: `https://github.com/balda/ruuvitag-discovery`,
    };

    let ruuvitags = {};
    // let cols = [];
    // let cols = [
    //     {
    //         title: `Name`,
    //         field: `name`,
    //         class: `text-left`,
    //         render: (tag, field = `last`) => {
    //             let name = `${tag.id.substring(0,4)}`;
    //             if (tag.id && ruuvitags[tag.id]) {
    //                 name = `${ruuvitags[tag.id]}`;
    //             }
    //             return `
    //                 <a href="#" class="rename-ruuvitag mr-2 app-color" data-id="${tag.id}"><i class="fas fa-edit"></i></a>
    //                 <span class="jstooltip" title="${tag.id}">
    //                     ${name}
    //                 </span>
    //             `;
    //         },
    //     },
    // ];
    let panel = `discover`;

    const ws = new WebSocket(`ws://${document.URL.split(`//`).splice(1).join(`//`)}`);
    ws.addEventListener(`message`, (message) => {
        try {
            const data = JSON.parse(message.data);
            if (data.tag) {
                const tagIndex = $tags.findIndex(tag => tag.id === data.tag.id);
                $tags[tagIndex === -1 ? $tags.length : tagIndex] = data.tag;
            }
        } catch(error) {
            console.log(error);
        }
    });
    // ws.addEventListener(`open`, () => {
    //     console.log(`ws connected`);
    // });
    ws.addEventListener(`message`, (message) => {
        try {
            const data = JSON.parse(message.data);
            if (data.addon) {
                console.log(data);
                addon = data.addon;
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
                if (data.config.targets) {
                    $targets = data.config.targets;
                }
                if (data.config.ruuvitags) {
                    ruuvitags = data.config.ruuvitags;
                }
                if (data.config.columns) {
                    $config.columns = data.config.columns;
                }
            }
            if (data.measures) {
                $dictMeasures = data.measures;
                $cols = data.measures.map(measure => {
                    measure.render = `measure`;
                    measure.show = $config.columns ? $config.columns[measure.field] : measure.required === undefined;
                    return measure;
                });
                $cols.splice(0, 0, {
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
                });
                $cols.push({
                    label: `Last seen`,
                    field: `ts`,
                    render: `date`,
                    show: true,
                });
            }
            if (data.targets) {
                $dictTargets = data.targets;
            }
        } catch(error) {}
    });
</script>

<main>
    <Container fluid id="page">
        <Row class="app-bgcolor" id="header">
            <Col xs="8" class="p-3 pl-4">
                <span class="mr-4">{addon.name}</span>
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
                            <a class="text-white font-weight-lighter text-decoration-none" href="{addon.url}/blob/master/CHANGELOG.md" target="_blank">
                                v{addon.version}
                            </a>
                        </em>
                    </small>
                    <a class="ml-2 text-white" href="{addon.url}" target="_blank">
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
                <PanelDiscover {ruuvitags} />
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
