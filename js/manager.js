var manager = function() {
    var dom_cache = {
        body: $('body'),
        menu: $('ul.menu'),
        dl_speed: $('.status-panel td.speed.download'),
        up_speed: $('.status-panel td.speed.upload'),
        status: $('.status-panel td.status'),
        label_select: $('ul.menu li.select select'),
        tr_layer: $('.torrent-list-layer'),
        tr_table_main: $('.torrent-table-body'),
        tr_table_fixed: $('.torrent-table-head'),
        tr_body: $('.torrent-table-body > tbody'),
        tr_head: $('.torrent-table-body > thead'),
        tr_fixed_head: $('.torrent-table-head > thead'),
        fl: $(".file-list"),
        fl_layer: $('.file-list > .fl-layer'),
        fl_table_main: $('.fl-table-body'),
        fl_table_fixed: $('.fl-table-head'),
        fl_body: $('.fl-table-body > tbody'),
        fl_head: $('.fl-table-body > thead'),
        fl_fixed_head: $('.fl-table-head > thead'),
        fl_bottom: $('.file-list ul.bottom-menu'),
        drop_layer: $('div.drop_layer')
    };
    var var_cache = {
        status: null,
        //кэшироованный список торрентов
        tr_list: {},
        //кэшированный список дом дерева торрентов
        tr_list_dom: {},
        //кэширует статус отображения торрента, скрытые имеют класс filtered
        tr_list_display: {},
        //кэшироованный список файлов
        fl_list: [],
        //кэшированный список дом дерева файлов
        fl_list_dom: [],
        //кэш списка папок файлов, для отображения папок
        fl_list_gui: [],
        //кэш названия и отображения файла {mod_name: false, show: false}
        fl_list_gui_display: [],
        //текущий фильтр таблицы
        current_filter: {label: 'all', custom: 1},
        //кэш скорости загрузки
        speed_limit: {},
        //кэш текущей позиции торрентов
        tr_sort_pos: [],
        //кэш текущей позиции файлов
        fl_sort_pos: [],
        //текущий столбец сортировки файлов
        fl_sort_colum: 'name',
        //текущая сортировка по возр. или убыванию. для файлов
        fl_sort_by: 1,
        //текущий столбец сортировки торрентов
        tr_sort_colum: 'name',
        //текущая сортировка по возр. или убыванию. для торрентов
        tr_sort_by: 1,
        //номер item в массиве информации о торренте, получается из названия столбца.
        tr_sort_index: undefined,
        //номер item в массиве информации о файле, получается из названия столбца.
        fl_sort_index: undefined,
        //статус отображения списка файлов
        fl_show: false,
        //масств id файлов, генерируется при появлении контекстного меню файлов
        fl_list_ctx_sel_arr: [],
        //триггер на случай если меню файл-листа скрыто
        fl_bottom_hide: false,
        //
        drag_timeout: undefined
    };
    var options = {
        scroll_width: 17,
        tr_word_wrap: false,
        fl_word_wrap: true,
        moveble_enabled_tr: true,
        window_mode: false
    };


}();