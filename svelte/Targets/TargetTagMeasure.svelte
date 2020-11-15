<script>
    // import { createEventDispatcher } from 'svelte';
    // import { Form, FormGroup, FormText, Input, CustomInput, Label, Button, Table, Row, Col } from 'sveltestrap';
    import { CustomInput } from 'sveltestrap';
	import Cell from './../Discover/Cell.svelte';
    // import Tooltip from './../UI/Tooltip.svelte';
    export let measure = {};
    export let tag = {};
    export let targetTag = {};
    let selected;
    if (targetTag.measures && targetTag.measures[measure.field]) {
        selected = true;
    }
</script>

<div>
    <div class="float-right">
        <Cell col={measure} {tag} source="last" showUnit="true" />
    </div>
    <CustomInput
        bind:checked={selected}
        type="switch"
        id="tag_{tag.id}_measure_{measure.field}"
        name="tag_{tag.id}_measure_{measure.field}"
        label="{measure.label}" />
</div>
<!-- <pre>{JSON.stringify(tag, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify(measure, null, 2)}</pre> -->
