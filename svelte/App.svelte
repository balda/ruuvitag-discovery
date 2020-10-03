<script>
	import { Container, Row, Col } from "sveltestrap";
	import PanelDiscover from './Discover/Panel.svelte';
	import PanelTargets from './Targets/Panel.svelte';
	import PanelConfig from './Config/Panel.svelte';
	export let ws;
	export let ruuvi;
	let addon = {
		name: `RuuviTags Discovery`,
		version: `0.0.1`,
		url: `https://github.com/balda/ruuvitag-discovery`,
	};
	let config = {
		measures: [],
		targets: [],
	};
	let tags = [];
	let targets = [];
	let indexedTags = {};
	let ruuvitags = {};
	let cols = [];
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
	//     }, {
	//         title: `Samples`,
	//         field: `samples`,
	//         global: true,
	//         render: (tag) => {
	//             return `
	//                 ${tag.samples ? Math.round(tag.samples) : `-`}
	//             `;
	//         },
	//     }, {
	//     // }, {
	//     //     title: `Last seen (sec)`,
	//     //     field: `ts`,
	//     //     render: (tag, field = `last`) => {
	//     //         if (!tag[field]) {
	//     //             return ``;
	//     //         }
	//     //         const data = tag[field].ts;
	//     //         const m = moment(data);
	//     //         return `
	//     //             <span class="jstooltip" title="${m.format(`YYYY-MM-DD HH:mm:ss`)}<br><em>${m.fromNow()}</em>">
	//     //                 ${((Date.now() - data) / 1000).toFixed(0)}
	//     //             </span>
	//     //         `;
	//     //     },
	// 	},
	// ];
	let panel = `discover`;
	ws.onopen = () => {
		console.log(`ws connected`);
	};
	ws.onmessage = (message) => {
		try {
			const data = JSON.parse(message.data);
			if (data.addon) {
				console.log(data);
				addon = data.addon;
			}
			if (data.config) {
				config = data.config;
				if (data.config.targets) {
					targets = data.config.targets;
					for (const target of targets) {
						if (target.tags) {
							for (const tag in target.tags) {
								if (indexedTags[tag] === undefined) {
									indexedTags[tag] = {
										targets: [],
									};
								}
								indexedTags[tag].targets.push(target);
							}
						}
					}
					console.log(indexedTags);
				}
				if (data.config.ruuvitags) {
					ruuvitags = data.config.ruuvitags;
				}
				// if (data.config.columns) {
				// 	cols = Object.keys(data.config.columns).map(field => {
				// 		return {
				// 			field,
				// 		}
				// 	});
				// }
			}
			if (data.measures) {
				config.measures = data.measures;
				cols = config.measures.map(measure => {
					measure.render = `measure`;
					// measure.show = true;
					measure.show = measure.required === undefined;
					return measure;
				});
				cols.splice(0, 0, {
					label: `ID`,
					field: `id`,
					class: `text-left`,
					render: `text`,
					show: true,
				}, {
					label: `Mac Address`,
					field: `mac`,
					class: `text-left`,
					render: `text`,
					show: true,
				}, {
					label: `Data Format`,
					field: `dataFormat`,
					render: `measure`,
					show: true,
				});
				cols.push({
					label: `Last seen`,
					field: `ts`,
					render: `date`,
					show: true,
				});
			}
			if (data.targets) {
				config.targets = data.targets;
			}
			if (data.tag) {
				const tagIndex = tags.findIndex(tag => tag.id === data.tag.id);
				tags[tagIndex === -1 ? tags.length : tagIndex] = data.tag;
			}
			// console.log({config: config.targets}); // targets dict
			// console.log({targets}); // targets config
		} catch(error) {}
	};
	// console.log(ws);
	// import { onMount } from 'svelte';
</script>

<main>
	<Container fluid id="page">
		<Row class="app-bgcolor" id="header">
			<Col xs="8" class="p-3 pl-4">
				<span class="mr-4">{addon.name}</span>
				<a on:click|preventDefault={() => {panel = `discover`}} class="mr-4 text-white text-decoration-none" href="/">
					<i class="fab fa-bluetooth fa-sm"></i>
					<small class="ml-1 font-weight-lighter">
						Discover
					</small>
				</a>
				<a on:click|preventDefault={() => {panel = `targets`}} class="mr-4 text-white text-decoration-none" href="/">
					<i class="fas fa-database fa-sm"></i>
					<small class="ml-1 font-weight-lighter">
						Targets
					</small>
				</a>
				<a on:click|preventDefault={() => {panel = `config`}} class="mr-4 text-white text-decoration-none" href="/">
					<i class="fas fa-cog fa-sm"></i>
					<small class="ml-1 font-weight-lighter">
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
				<PanelDiscover {tags} {targets} {indexedTags} {ruuvitags} {cols}/>
			{/if}
			{#if panel === `targets`}
				<PanelTargets/>
			{/if}
			{#if panel === `config`}
				<PanelConfig/>
			{/if}
		</div>
	</Container>
</main>

<style>
</style>
