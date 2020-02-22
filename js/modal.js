app.modal = {
    created: false,
    get: () => {
        const $modal = $(`#modal`);
        if (app.modal.created === false) {
            $modal.modal({
                focus: false,
                show: false,
            });
            app.modal.created = true;
        }
        return $modal;
    },
    show: (config = {}) => {
        const $modal = app.modal.get();
        $modal.find(`.modal-header`).html(config.header || ``);
        $modal.find(`.modal-body`).html(config.body || ``);
        $modal.find(`.modal-footer`).html(config.footer || ``);
        $modal.modal(`show`);
        $modal.find(`.jstooltip`).tooltip({
            html: true,
        });
    },
    hide: () => {
        app.modal.get().modal(`hide`);
    },
};
