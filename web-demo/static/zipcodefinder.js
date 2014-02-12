tfunction () {

var ZIPCodeFinder = window.ZIPCodeFinder = function (obj) {

    obj = $.extend({
        address: undefined,
        zipcode: undefined,
    }, obj);

    this._$view = $(ZIPCodeFinder.template(obj));
    this._$address = this._$view.find('.address');
    this._$address_with_zipcode = this._$view.find('.address-with-zipcode');
    this._$loader = this._$view.find('.loader');

    this._units_re = /[縣市鄉鎮市區村里路段街巷弄號樓]/;
    this._model = {};
    this.model(obj);

    this._$address.on('input',
        _.bind(this.controller, this, 'address-input')
    );

    this._$address_with_zipcode.on('click',
        _.bind(this.controller, this, 'address-with-zipcode-click')
    );

};

ZIPCodeFinder.template = _.template(
    '<article class="zipcode-finder">'+
        '<input class="address" placeholder="請在這裡輸入欲查詢的地址" value="'+
            '<%- address %>'+
        '">'+
        '<div class="address-with-zipcode-wrapper">'+
            '<input class="address-with-zipcode" placeholder="接著郵遞區號就會顯示在這邊" value="'+
                '<%- zipcode %><%= zipcode ? " " : "" %><%- address %>'+
            '">'+
            '<img class="loader" src="/static/loader.gif">'+
        '</div>'+
    '</article>'
);

ZIPCodeFinder.create = function (obj) {
    return (new ZIPCodeFinder(obj))._$view;
};

ZIPCodeFinder.prototype.view = function (model_changed) {

    if (model_changed.loading !== undefined) {
        this._$view.toggleClass('loading', model_changed.loading);
    }

    if (
        model_changed.zipcode != undefined ||
        model_changed.address != undefined
    ) {
        var zipcode = this._model.zipcode || '';
        var address = this._model.address || '';
        this._$address_with_zipcode.val(zipcode + (zipcode ? ' ' : '') + address)
    }

};

ZIPCodeFinder.cache = {};

ZIPCodeFinder.prototype.model = function (model_changed) {

    var _this = this;

    // update the internal model
    $.each(model_changed, function (key, value) {
        if (_this._model[key] === value) {
            delete model_changed[key];
        } else {
            _this._model[key] = value;
        }
    });

    if (
        model_changed.address !== undefined &&
        this._units_re.test(model_changed.address.slice(-1))
    ) {
        // try cache or send request
        var zipcode = ZIPCodeFinder.cache[model_changed.address];
        if (zipcode !== undefined) {
            _this.model({zipcode: zipcode});
        } else {
            _this.model({loading: true});
            $.getJSON('/api/find', {
                address: model_changed.address
            }).done(function (resp) {
                var zipcode = resp.result;
                ZIPCodeFinder.cache[model_changed.address] = zipcode;
                _this.model({zipcode: zipcode});
            }).always(function () {
                _this.model({loading: false});
            });
        }
    } else if (model_changed.address === '') {
        _this.model({zipcode: ''});
    }

    this.view(model_changed);

};

ZIPCodeFinder.prototype.controller = function (event_name) {

    switch (event_name) {

        case 'address-input':
            this.model({address: this._$address.val()});
            break;

        case 'address-with-zipcode-click':
            this._$address_with_zipcode.select();
            break
    }

};

})();
