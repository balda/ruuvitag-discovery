<script>
	import CellMeasure from './Cell/Measure.svelte';
	import CellText from './Cell/Text.svelte';
    import CellDate from './Cell/Date.svelte';
    export let col = {};
    export let tag = {};
    export let source = `last`;
    export let showUnit = false;
	// TODO: use https://svelte.dev/tutorial/svelte-component
</script>

{#if col.render === `measure`}
    <CellMeasure {col} {tag} {source} {showUnit} />
{/if}
{#if col.render === `text`}
    <CellText {col} {tag} {source} />
{/if}
{#if col.render === `date`}
    <CellDate {col} {tag} {source} />
{/if}
