<script>
    import { api } from './../../store/api.js';
    import { config } from './../../store/config.js';
    import {
        Button,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader
    } from 'sveltestrap';
    import Tooltip from './../../UI/Tooltip.svelte';
    export let tag = {};
    let state = `view`; // `view` | `saving`
    let open = false;
    const toggle = () => (open = !open);
    let value = ``;
    if (tag.id && $config.ruuvitags[tag.id]) {
        value = $config.ruuvitags[tag.id];
    }
    async function save() {
        state = `saving`;
        try {
            const ruuvitags = JSON.parse(JSON.stringify($config.ruuvitags));
            if (value === ``) {
                delete ruuvitags[tag.id];
            } else {
                ruuvitags[tag.id] = value;
            }
            await api.post(`config`, {
                ruuvitags,
            });
            $config.ruuvitags = ruuvitags;
        } catch(error) {
            console.log(error);
        }
        state = `view`;
        open = false;
    }
</script>

<a on:click|preventDefault={toggle} href="/" class="mr-1 fa-sm text-primary"><i class="fas fa-edit"></i></a>
<Tooltip tip="{tag.id}" >
    {value !== `` ? value : tag.id.substring(0,4)}
</Tooltip>
<Modal isOpen={open} {toggle} size="lg">
    <ModalHeader {toggle}>
        Rename RuuviTag
        <span class="font-weight-lighter mx-2">
            {tag.id}
        </span>
    </ModalHeader>
    <ModalBody>
        <div class="container-fluid small">
            <label>Name</label>
            <input type="text" bind:value name="ruuvitag-name" disabled={state === `saving` ? `disabled` : null} class="form-control form-control-sm">
        </div>
    </ModalBody>
    <ModalFooter>
        <Button class="btn btn-light btn-sm mr-4" on:click={toggle}>Cancel</Button>
        <a href="/" on:click|preventDefault={save} class="btn btn-light btn-sm {state === `saving` ? `disabled` : null}">
            Save
        </a>
    </ModalFooter>
</Modal>
