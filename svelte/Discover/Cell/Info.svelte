<script>
    import { cols } from './../../store/api.js';
    import { config } from './../../store/config.js';
    import {
        Button,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader
    } from 'sveltestrap';
    import Tooltip from './../../UI/Tooltip.svelte';
	import Cell from './../Cell.svelte';
    export let tag = {};
    let tagName = false;
    if (tag.id && $config.ruuvitags[tag.id]) {
        tagName = $config.ruuvitags[tag.id];
    }
    let open = false;
    const toggle = () => (open = !open);
    const sources = [`last`, `median`, `first`];
    const col = (field) => {
        return $cols.find(c => c.field === field);
    };
</script>

<Tooltip tip="Infos" left >
    <a on:click|preventDefault={toggle} href="/" class="mx-1 text-primary"><i class="fas fa-info-circle"></i></a>
</Tooltip>
<Modal isOpen={open} {toggle} size="lg">
    <ModalHeader {toggle}>
        RuuviTag
        <span class="font-weight-lighter mx-2">
            {tagName || tag.id}
        </span>
        {#if tagName}
            <span class="small font-weight-lighter font-italic mx-2">
                {tag.id}
            </span>
        {/if}
    </ModalHeader>
    <ModalBody>
        <div class="container-fluid">
            <div class="row">
                <div class="col text-left font-weight-bolder">
                    Measure
                </div>
                {#each sources as source}
                    <div class="col text-right font-weight-bolder">
                        {source}
                    </div>
                {/each}
            </div>
            {#each Object.keys(tag.last).filter(field => field !== `id`).sort() as field}
                <div class="row font-weight-lighter">
                    <div class="col text-left">
                        {col(field).label}
                    </div>
                    {#each sources as source}
                        <div class="col text-right">
                            <Cell col={col(field)} {tag} {source} showUnit="true" />
                        </div>
                    {/each}
                </div>
            {/each}
        </div>
    </ModalBody>
    <ModalFooter>
        <span class="mr-4 font-weight-lighter">
            Samples:
            <Cell col={col(`samples`)} {tag}/>
        </span>
        <span class="mr-4 font-weight-lighter">
            Freq / min:
            <Cell col={col(`frequency`)} {tag}/>
        </span>
        <span class="mr-4 font-weight-lighter">
            Period (sec):
            <Cell col={col(`period`)} {tag}/>
        </span>
        <Button color="secondary" outline size="sm" on:click={toggle}>close</Button>
    </ModalFooter>
</Modal>
