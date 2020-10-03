<script>
    import {
        Button,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader
    } from 'sveltestrap';
    import Tooltip from './../../UI/Tooltip.svelte';
    export let target = {};
    export let tag = {};
    let open = false;
    const toggle = () => (open = !open);
    let tagConfig = target.tags[tag.id];
</script>

<Tooltip tip="{target.name}" left >
    <a on:click|preventDefault={toggle} href="/" class="mx-1 {1 * target.enable ? `text-success` : `text-danger`}"><i class="fas fa-database"></i></a>
    <Modal isOpen={open} {toggle} size="lg">
        <ModalHeader {toggle}>
            RuuviTag
            <span class="font-weight-lighter mx-2">
                {tag.id}
            </span>
            |
            Target
            <span class="font-weight-lighter ml-2">
                {target.name}
            </span>
        </ModalHeader>
        <ModalBody>
            <div class="container-fluid">
                <div class="row text-left">
                    <div class="col-md-6">
                        <p><strong>Tag</strong></p>
                        <div class="font-weight-lighter">
                            <strong>Name</strong> {tagConfig.name}<br>
                            <strong>Field</strong> {tagConfig.field}<br>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Measures</strong></p>
                        <div class="font-weight-lighter">
                            {#each Object.keys(tagConfig.measures) as measure}
                            <div>
                                <strong>Label</strong> {tagConfig.measures[measure].label}
                                -
                                <strong>Field</strong> {tagConfig.measures[measure].field}
                            </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        </ModalBody>
        <ModalFooter>
            <Button color="secondary" outline size="sm" on:click={toggle}>close</Button>
        </ModalFooter>
    </Modal>
</Tooltip>
