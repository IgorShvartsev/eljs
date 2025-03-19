
import {default as el} from './../../el.js';

export default ((eee) => {
    const init = (options, callback) => new Table(options, callback);
    const rand = (min, max) => Math.random() * (max - min + 1) + min;
    const uniq = (length) => {
        let str = '';
        for (let i = 0; i < length; i++) {
            str += String.fromCharCode(parseInt(rand(0x61, 0x7a)));
        }
        return str;  
    }
    
    /**
     * Table class
     * data structure returned is a json type and has following format
     * {
     *    'id'         : 12,         // recordset id
     *    'total'      : 100,        // total count of records
     *    'page'       : 1,          // current page number
     *    'perpage'    : 25,         // records per page,
     *    'like'       : [],         // arrow of ids  of like records 
     *    'likeFilter' : 0,          // enable showing only like records 
     *    'thead'      : [
     *                   {'id' : 135, 'field':'email', 'name':'Email', 'type': 'email', 'order': 2, 'required' : 1 , width':'40', 'sortable': 1},
     *                   {'id' : 136, 'field': 'married', 'name':'Married', 'type': 'yesno', 'order': 3, 'required' : 0 , width':'20', 'sortable' : 1}
     *                   ],
     *    'tbody'      : {
     *                  '321-column' : ['test@test.com', 'yes'],  // or [{'value' : 'test.com', 'data' : {'error':'', 'status':'','tip':''}}, 'Name A']
     *                  '322-column' : ['test@test.com', 'no']
     *                    }
     * }
     *
     * tbody  can be simple html and has next format:
     *       <tr id=tr-321>
     *            <td><div class="cText"></div></td>
     *            <td><div class="cText"></div></td>
     *            .........
     *        </tr>
     *        <tr id=tr-322>
     *            <td><div class="cText"></div></td>
     *            <td><div class="cText"></div></td>
     *            .........
     *        </tr>
     *        ........ 
     */
    class Table {
        tableId;
        settings = {};
        ajaxParams = {};  
        $header;         
        $body;           
        $dummyTD;        
        lock = false;

        constructor (options, callback, baseurl) {
            const url = baseurl ?? '/';
            let $wrapper;
            let $top;
            let $form;
            let self = this;
            let defaults = {
                name: '',   // table name
                model: '',  // database table
                id: 0,      // recordset Id
                csrf_protection: {  // csrf protection
                    name: 'csrf_protection',
                    value: ''
                },      
                cellpadding: 0,    // table cellpadding attribute
                cellspacing: 0,    // table cellspacing attribute
                container: 'body', // DOM selector where table should be inserted
                css: {             // CSS for table elements
                    wrapper: {overflow: 'hidden'},
                    top: {},
                    table: {},
                    scrollY: {height: '400px'},
                    bottom: {position: 'relative'},
                    pagination: {},
                    overlay: {'background-color': '#fff', opacity: '0.5', position: 'absolute', 'z-index': 1000},
                    loader: {width: '64px', height: '64px',}
                },
                overlay: true,               // makes table to be slightly disabled while ajax is running
                editable: false,             // editable (not implemented yet)
                sortableRow: false,          // makes rows to be sorted clicking on sorting icons in th
                sortableColumn: false,       // makes columns to be sorted (drag&drop)
                searchable: false,           // activate search box at the top of table  
                enableRowSelection: false,   // enable row selection by mouse click
                enableColumnSelection: false,// enable column selection by mouse click
                dynamicPagination: false,    // enable dynamic pagination while scrolling
                onCompleteRows: function(){},     // event when rows bulding ended 
                onAddRows   : function(){},       // event when rows dynamically added (dynamic pagination)     
                thOnClick   : function(event, table){}, // th callback on event Click
                thOnDblClick: function(event, table){}, // th callback on event Double Click
                tdOnClick   : function(event, table){}, // td callback on event Click
                tdOnDblClick: function(event, table){}, // td callback on event Double Click
                thOnEdit    : function(event, table){}, // th callback on event Edit
                tdOnEdit    : function(event, table){}, // td callback on event Edit
                trOnDelete  : function(event, table){return true}, // tr callback on event Delete
                thOnDelete  : function(event, table){return true}, // th callback on event Delete
                page        : 1,                 // current number of page. 
                perpage     : 25,                // number of table rows per page. If 0 , pagination is disabled. 
                total       : 0,                 // total rows that table should contain 
                ajaxSave    : url + 'ajax/save', // server side ajax url to save edited data
                ajaxGet     : url + 'ajax/get',  // server side ajax url to get data
                ajaxDelete  : url + 'ajax/delete',// server side ajax url to delete data
                ajaxSort    : url + 'ajax/sort', // server side ajax url to sort data   
                sortField   : '',                // field name  sorted by 
                sortOrder   : 1,                 // sort order 1 - ASC, 0 - DESC
                search      : '',                // word to be searched initially, leave empty to disable searching    
                like        : [],                // array of values ( offen record IDs)
                likeFilter  : false,             // enable like filter 
                groupField  : ''                 // group by this field
            };

            this.settings = {...defaults, ...options};

            this.tableId = (this.settings.name === '' ? uniq(10) : this.settings.name) + '-table';

            if (eee.q('#' + this.tableId).length()) {
                alert('Sorry. Table with Id = ' + this.tableId + ' already exists. Try another name.');
                return;
            }

            $wrapper = eee.create('div')
                .addAttr({id: this.tableId})
                .css(this.settings.css.wrapper)
                .css('position', 'relative')
                .addClass('el-container')
                .appendTo(eee.q(this.settings.container));

            $top = eee.create('div')
                .css(this.settings.css.top)
                .addClass('table-top')
                .css('position', 'relative')
                .appendTo($wrapper);

            $form = eee.create('form').appendTo($top);

            // dummy TD
            this.$dummyTD = eee.create('table')
                .css(this.settings.css.table)
                .addClass('el-table')
                .addAttr('cellpadding', this.settings.cellpadding)
                .addAttr('cellspacing', this.settings.cellspacing)
                .html('<thead><th></th></thead><tbody><tr><td></td></tr></tbody>')
                .appendTo($wrapper).hide().find('td');
            
            // header table
            this.$header = eee.create('table')
                .addAttr('id', this.tableId + '_header')
                .addClass('el-table', 'el-table-header')
                .css(this.settings.css.table)
                .addAttr('cellpadding', this.settings.cellpadding)
                .addAttr('cellspacing', this.settings.cellspacing)
                .css('width', 0)
                .appendTo(
                    eee.create('div')
                        .addClass('scroll_header')
                        .css({overflow: 'hidden', width: '100%'})
                        .appendTo($wrapper))
                        .data('sort', {field: '', 'asc': 1}
                );
            
            // body table
            this.$body = eee.create('table')
                .addAttr('id', this.tableId + '_body')
                .css(this.settings.css.table)
                .addClass('el-table', 'el-table-body')
                .addAttr('cellpadding', this.settings.cellpadding)
                .addAttr('cellspacing', this.settings.cellspacing)
                .css('width', 0)
                .appendTo(
                    eee.create('div')
                        .addClass('scroll_body')
                        .css({overflow: 'auto', width: '100%'})
                        .css(this.settings.css.scrollY)
                        .appendTo($wrapper)
                );

            let $hdr = this.$header;
            $wrapper.find('.scroll_body').event('scroll', function () {
                const $scrollBody = eee.q(this);
                eee.q('.inline-edit-block form').children().trigger('reset');
                $hdr.css('margin-left', -$scrollBody.prop('scrollLeft') + 'px');

                if (self.settings.dynamicPagination) {
                    let h = $scrollBody.children().prop('height') - $scrollBody.prop('height');
                    let curY = $scrollBody.prop('scrollTop');

                    if (curY >= h  && self.settings.page * self.settings.perpage <= self.settings.total) {
                        self.#dynamicPageLoading(self.settings.page + 1);
                    }
                }
            });

            // bottom  with pagination
            const $tBottom = eee.create('div')
                .addClass('table-bottom')
                .css(this.settings.css.bottom)
                .appendTo($wrapper)
                .html('<div class="pagination"></div><div class="info"></div>');

            const $pgn = $tBottom.find('.pagination').css(this.settings.css.pagination);

            !this.settings.dynamicPagination || $pgn.hide();
            this.#paginationEvents($pgn);

            eee.create('div')
                .addClass('table-overlay')
                .css(this.settings.css.overlay)
                .css({display: 'none', position: 'absolute'})
                .appendTo($wrapper);

            // top with search box
            if (this.settings.searchable) {
                const $searchWrap = eee.create('div')
                    .addClass('search-wrap')
                    .appendTo($top)
                    .html('<input class="search" type="text" name="search" /> <button type="button">Search</button>');

                $searchWrap.find('button').event('click', function () {
                    const search = eee.q(this).siblings('.search').get();

                    if (search.value != '') {
                        self.search(search.value);
                    }
                });

                $searchWrap.find('.search').data('backspace', false).event('keydown', function (e) {
                    const $search = eee.q(this);

                    if (e.which == 13) {
                        $search.siblings('button').get().click();
                        return;
                    }

                    (e.which == 8 || e.which == 46 ) && this.value.length  ? $search.data('backspace', true) : null;
                }).event('keyup', function () {
                    const $search = eee.q(this);
                    $search.data('backspace') && !this.value.length ? self.search('') : null; 
                    $search.data('backspace', false);
                });
            }
            
            if (callback && typeof callback === 'function') {
                callback.call(this);
            }
        }

        destroy() {
            this.$header.remove();
            this.$body.remove();
            this.$dummyTD.remove();
            delete this.settings;
            delete this.$header;
            delete this.$body;
            delete this.$dummyTD;
            delete this.lock;
            delete this.ajaxParams;
        }


        getData(id, params) {
            const self = this;
            this.ajaxParams = this.isPlainObject(params) ? params : {}; 
            this.showOverlay();

            this.getRequest(
                this.settings.ajaxGet + '?r=' + rand(1000, 10000000), 
                this.makeRequestParams('get', id, {...{'data[all]': 1}, ...this.ajaxParams}), 
                function(data) {
                    self.setData(data)
                    self.hideOverlay();
                } 
            );

            return this;
        }
        
        setData(data) {
            this.$header.empty().html('<thead><tr class="unirow"></tr></thead>');
            this.$body.empty().html('<tbody></tbody>');

            if (typeof data !== 'object') {
                console.log('Data is not an object');
                return;
            }

            if (!data.thead || !Array.isArray(data.thead)) {
                console.log('Table can\'t be initialized. Param \'thead\' is not defined or is not an array');
                return;
            }
            
            this.settings.perpage = typeof data.perpage !== 'undefined' ? data.perpage : 0;
            this.settings.page = typeof data.page !== 'undefined' ? data.page : this.settings.page;
            this.settings.id = typeof data.id !== 'undefined' ? data.id : this.settings.id;
            
            // add columns
            data.thead.forEach((params) => this.addColumn(params));
            // add rows
            this.setRows(data);
            // set pagination
            this.pagination(eee.q(this.settings.container).find('.pagination')); 
            // finally adjust table width
            this.adjustTableWidth();
            this.#setEvents();
            
            return this;
        }

        setRows(data, addmode) {
            const $tbody = this.$body.find('tbody');
            let $tb;

            this.settings.total = typeof data.total !==  'undefined' ? data.total : this.settings.total;
            this.settings.like = typeof data.like !== 'undefined' && data.like && Array.isArray(data.like) ? data.like : [];
            this.settings.likeFilter = typeof data.likeFilter !== 'undefined' ? parseInt(data.likeFilter) : false;

            addmode || $tbody.empty(); 
            $tb = $tbody.closest('#' + this.tableId).find('.table-bottom');
            
            if ($tb.length()) {
                $tb.find('.info').html(
                    'Total: <span class="total">' + this.settings.total + '</span>' 
                    + (
                        this.settings.like.length > 0 
                            ? ('Duplicate' + ': <span class="duplicate">' + this.settings.like.length + '</span>') 
                            : ''
                    )
                );
            }
            
            if (typeof data.tbody !== 'undefined' && Array.isArray(data.tbody) && !data.tbody.length) {
                data.tbody = {};   // fixing incorrect json encoding of empty value by PHP
            } 
            
            if (typeof data.tbody === 'undefined') {
                console.log('Rows can\'t be  set. Param \'tbody\' is not defined or is not an array');
                return;
            }
            
            if (this.isPlainObject(data.tbody)) {
                for (const key in data.tbody) {
                    this.addRow(parseInt(key), data.tbody[key]);
                }
            } else {
                this.setHtml(data.tbody);
            }

            this.updateRows();
            addmode ? this.settings.onAddRows.call(this) : this.settings.onCompleteRows.call(this);
            
            return this;
        }
        
        addRow(id, columns, bUpdate, callback) {    
            const self  = this;
            const $tbody = this.$body.find('tbody');
            const $th = this.$header.find('th');
            const $tr = eee.create('tr').addAttr('id', 'tr-' + id);
            let cols  = '';

            if (this.settings.like.includes(id.toString())) {
                $tr.addClass('like');
            }

            for (let i = 0; i < $th.length(); i++) {
                let $thItem = eee.q($th.get(i));
                cols += self.#addColumn(
                    this.isPlainObject(columns[i]) && columns[i].value ? columns[i].value : (typeof(columns[i]) === 'string' ? columns[i] : '') , 
                    $thItem.data('params'), 
                    $thItem.hasClass('selected'), 
                    this.isPlainObject(columns[i]) &&  columns[i].data ? columns[i].data : null 
                );
            };
            
            $tr.html(cols).appendTo($tbody).event('contextmenu', function (e) {
                e.preventDefault();
                if (self.settings.enableRowSelection) {
                    let $tr = eee.q(this);
                    $tr.hasClass('selected') ? $tr.removeClass('selected') : $tr.addClass('selected');
                    e.altKey || $tr.siblings().removeClass('selected');
                }
                return false;
            });
            
            if (bUpdate){
                this.updateRows();
            }

            return this;
        }

        addColumn(params, bUpdate, callback) {
            const self = this;
            const $tr = this.$header.find('thead tr');

            if (this.isPlainObject(params)) {
                const $th = eee.create('th')
                    .appendTo($tr)
                    .data('params', {}).addAttr({rowspan: '1', colspan: '1'})
                    .html('<div class="column-header" style="position:relative;overflow:hidden;"><span class="column-title" style="overflow:hidden;display:block;width:100%;cursor:default;"></span></div>');
                
                if (this.settings.sortableColumn) {
                    $th.addAttr('draggable', true);
                }
                
                const $ch = $th.find('.column-header');
                const chPd = $ch.prop('padding-left') + $ch.prop('padding-right');
                let thData = $th.data('params');

                if (!params.width) {
                    params.width = $th.prop('width');
                } 
                
                (new Map(Object.entries(params))).forEach((val, param) => {
                    if (param === 'width') {
                        let w = parseInt(val) - chPd;
                        if (w < 0) {
                            val = chPd
                        }    
                        $ch.css('width', w > 0 ? (w + 'px' ) : 0);
                        $th.css('width', val + 'px');
                        thData['cssWidth'] = val;
                        val = parseInt(val) + $th.prop('border-right-width') * 2 + $th.prop('padding-left') + $th.prop('padding-right');
                    }

                    if (param === 'id') {
                        $th.addAttr('id', 's-' + val);
                    }

                    if (param === 'name') {
                        $ch.find('.column-title').html(val);
                    }
                    
                    if (param === 'sortable' && val == 1 && self.settings.sortableRow) {
                        eee.create('span')
                            .addClass('column-sort', 'column-sort-idle') 
                            .addAttr('title', 'Sorting')
                            .css({cursor: 'pointer', position: 'absolute', opacity: '0.3'})
                            .appendTo($th.find('.column-header'));
                    }

                    thData[param] = val;
                });

                $th.data('params', thData);

                if (thData.field) {
                    self.$body.find('tbody tr').append(self.#addColumn('', thData));
                } else {
                    console.log('TH data doesn\'t contain param `field`');
                }

                if (bUpdate){
                    this.adjustTableWidth(); 
                    $th.mousedown();
                }
            }

            return this;
        }
        
        removeColumn(index) {
            if (typeof index === 'object') {
                index = index.prevUntil().length();
            }

            this.$header.find('th').eq(index).remove();
            this.$body.find('tbody tr').each(function () {
                eee.q(this).find('td').eq(index).remove();
            });

            if ('\v' == 'v') this.restoreHeadersWidth();

            this.adjustTableWidth();
        }
        
        updateColumn($th, params) {
            const self = this;

            if (this.isPlainObject(params)) {
                const $tbody = this.$body.find('tbody');
                const $thead = this.$header.find('tr');
                const index = $th.childIndex();

                if (!$th.length()) {
                   console.error('Can\t find column');
                } else {
                    let  oldParams = $th.data('params');

                    (new Map(Object.entries(params))).forEach((val, param) => {
                        if (param === 'width') {
                            const $ch = $th.find('.column-header');
                            const chPd = ch.prop('padding-left') + ch.prop('padding-right');
                            let w = val - chPd;

                            if (w < 0) {
                                val = chPd;
                            } 

                            $ch.css('width', w > 0 ? (w + 'px') : 0);
                            params[param] = parseInt(val) + $th.prop('border-right-width') * 2 + $th.prop('padding-left') + $th.prop('padding-right');
                            $th.css('width', val + 'px');
                            params['cssWidth'] = val;
                        }

                        if (param === 'id') {
                            $th.addAttr('id', 's-' + val);
                        }

                        if (param === 'name') {
                            $th.find('.column-title').html(val);
                        }

                        if (param ==='field') {
                            $thead.find('th').each(function (el, i) {
                                if (i == index ) return;

                                let p = eee.q(this).data('params');

                                if (p.field === val) {
                                    self.removeColumn(i);
                                }
                            });
                        }
                    });

                    $th.data('params', {...oldParams, ...params});
                    
                    if (params.width) {
                        let w = parseInt(params.width) - this.$dummyTD.prop('padding-left') - this.$dummyTD.prop('padding-right') - this.$dummyTD.prop('border-right-width') * 2; 
                        $tbody.find('tr').each(function () {
                            let $cText = eee.q(this).find('td').eq(index).find('.cText');
                            $cText.css('width', (w - $cText.prop('padding-left') - $cText.prop('padding-right') - $cText.prop('border-right-width') * 2) + 'px');
                        });
                    }

                    this.adjustTableWidth();
                }
            }
        }

        pagination(container) {
            if (!this.settings.perpage || isNaN(this.settings.perpage)) {
                return;
            }

            const nP = Math.ceil(this.settings.total/this.settings.perpage);
            let html = '';

            if (this.settings.total > this.settings.perpage) {
                const p = this.settings.page;

                if (p != 1){
                    if (p > 1) {
                        html += '<a class="first" rel="1">First</a>';
                    }
                    html += '<a class="p" rel="' + (p -1 ) + '">Previous</a>';   
                }

                let i = 1;

                while (i <= nP && nP != 1) {
                    if (i >= (p - 4) && i < (p + 5)) {
                        html += i == p ? '<a class="x" rel="' + i + '">' + i + '</a>' : '<a rel="' + i + '">' + i + '</a>';
                    }
                    i++;
                }

                if (p < nP) {
                    html += '<a class="p" rel="' + (p + 1) + '">Next</a>'; 
                }
            }

            container.empty().html(html);

            return this;
        }
        
        getIndexByColumnField(field) {
            let index = -1;
            this.$header.find('th').each(function (el, i) {
                let params = eee.q(this).data('params');
                if (params.field == field) {
                    index = i;
                    return;
                }
            });

            return index;  
        }
        
        setPerPage(callback) {}
        
        search(text, callback) {
            const $pagination = eee.q(this.settings.container).find('.pagination .first');
            this.ajaxParams['data[search]'] = text;
            this.settings.page = 1;
            $pagination.length() ? $pagination.get().click() : this.redraw({}, true);

            return this;
        }

        save(params, callback) {
            const self = this;
            this.showOverlay();

            this.postRequest(
                this.settings.ajaxSave, 
                this.makeRequestParams('save', this.settings.id, params), 
                function (data) {
                    self.hideOverlay(); 
                    if (callback && typeof callback === 'function') {
                        callback.call(this, data);
                    }
                } 
            );
        }
        
        remove(id, text, params, callback) {
            const self = this;

            if (confirm('Delete?')) {
                this.showOverlay();

                this.postRequest(
                    this.settings.ajaxDelete,
                    this.makeRequestParams('delete', id, params),
                    function (data) {
                        self.hideOverlay(); 
                        if (callback && typeof callback === 'function') {
                            callback.call(this, data);
                        }
                    }  
                );
            }
        }
        
        redraw(params, p, callback) {
            const self = this;
            const backupScrollPosLeft = this.$body.parent().prop('scrollLeft'); 
            const backupScrollPosTop = this.$body.parent().prop('scrollTop');  
            this.showOverlay();
            params = params && this.isPlainObject(params) ? params : {}; 

            this.getRequest(
                this.settings.ajaxGet + '?r=' + rand(1000,10000000), 
                this.makeRequestParams('get', this.settings.id, {...this.ajaxParams, ...params}),
                function (data) {
                    self.setRows(data);
                    self.$body.parent().get().scrollLeft = backupScrollPosLeft;
                    self.$body.parent().get().scrollTop = backupScrollPosTop;

                    if (p) {
                        self.pagination(self.$body.parent().parent().find('.pagination'));
                    } 

                    typeof callback !== 'function' || callback.call(self, data);
                    self.hideOverlay()
                }  
            );
        }
        
        getLike() {
           return this.settings.like; 
        }
        
        updateRows() {
            const $tr = this.$body.find('tbody').find('tr').removeClass('odd').removeClass('even');
            $tr.filter((el,i) => i % 2 === 1).addClass('odd');
            $tr.filter((el,i) => i % 2 === 0).addClass('even'); 
        }

        setHtml(html) {
            this.$body.find('tbody').html(html);
        }
        
        makeRequestParams(type, id, data) {
            let params = {};

            if (!this.isPlainObject(data)) {
                console.error('Data passed to request params should be an object type');
                return;  
            }

            switch(type) {
                case 'get':
                    params = {...{
                        'id': id, 
                        'm': this.settings.model, 
                        'data[sort]': this.settings.sortField, 
                        'data[asc]': this.settings.sortOrder, 
                        'data[search]': this.settings.search,
                        'data[group]': this.settings.groupField,
                        'data[in]': this.settings.likeFilter && Array.isArray(this.settings.like) ? (this.settings.like.length == 0 ? 0 : this.settings.like.join(',')) : '', 
                        'data[page]': this.settings.page, 
                        'data[perpage]': this.settings.perpage
                    }, ...data};
                    params[this.settings.csrf_protection.name] = this.settings.csrf_protection.value;
                    break;
                case 'sort':
                    params = id +'&m=' + encodeURIComponent(this.settings.model) + '&' + this.settings.csrf_protection.name + '=' + encodeURIComponent(this.settings.csrf_protection.value);
                    break;
                case 'save':
                case 'delete':
                    params = {...{
                        id: id, 
                        m: this.settings.model
                    }, ...data};
                    params[this.settings.csrf_protection.name] = this.settings.csrf_protection.value;
                    break;
            }
            return params;
        }
        
        restoreHeadersWidth() {
            this.$header.find('th').each(function () {
                let params = eee.q(this).data('params');
                eee.q(this).css('width', params.cssWidth + 1);
            });
        }
        
        adjustTableWidth() {
            let w = 0;

            this.$header.find('th').each(function () {
                let params = eee.q(this).data('params');
                if (typeof params.width !== 'undefined') {
                    w += parseInt(params.width);
                }
            });
            
            if (w) {
                this.$header.css('width', w + 'px');
                this.$body.css('width', w + 'px');
                this.alignVerticalSortButtons();
            }   
        }
        
        getIndexColumn($td) {
            return $td.childIndex();
        }
        
        alignVerticalSortButtons() {
            this.$header.find('.column-header').each(function () {
                let $cH = eee.q(this);
                let $cS = $cH.find('.column-sort');
                !$cS.length() || $cS.css({'top': (($cH.prop('height') - $cS.prop('height'))/2) + 'px'});
            });
        }
        
        showOverlay() {
           if (!this.settings.overlay) return; 
           const $wrapper = this.$header.parent().parent();
           const $ovr = $wrapper.find('.table-overlay').css({width: $wrapper.css('width'), height: $wrapper.css('height'), 'left': 0, 'top': 0}).show();
           const $ldr = eee.create('div').addClass('el-table-loader').css(this.settings.css.loader).css({position: 'absolute', 'z-index': $ovr.css('z-index') + 1}).appendTo($wrapper);
           $ldr.css({left: (($ovr.prop('width') - $ldr.prop('width'))/2) + 'px', top: (($ovr.prop('height') - $ldr.prop('height')) / 2) + 'px'});
        }
        
        hideOverlay() {
           if (!this.settings.overlay) return;  
           this.$header.parent().parent().find('.table-overlay').hide();
           eee.q('.el-table-loader').remove();
        }
        
        cssToString(css) {
            let str = '';

            if (this.isPlainObject(css)) {
                for (let i in css) {
                    str += i + ':' + css[i] +';'
                }
                return str;
            } 

            return css;
        }

        isPlainObject(obj) { 
            return !!obj && typeof obj === 'object' && (obj.__proto__ === null || obj.__proto__ === Object.prototype);
        }

        getRequest(url, queryData, cb) {
            const self = this;
            if (queryData && this.isPlainObject(queryData)) {
                queryData = (new URLSearchParams(queryData)).toString();
            }
            if (queryData) {
                url += url.indexOf('?') !== -1 ? ('&' + queryData) : ('?' + queryData);
            }
            fetch(url)
            .then(response => response.json())
            .then(data => cb.call(self, data))
            .catch(error => {
                self.hideOverlay();
                console.log(error);
            });
        }

        postRequest(url, data, cb) {
            const self = this;
            fetch(url, {
                method: `POST`,
                body: new URLSearchParams(data)
            }).then(response => response.json())
            .then(data => cb.call(self, data))
            .catch(error => {
                self.hideOverlay();
                console.log(error);
            });
        }

        #addColumn(val, params, selected, data) {
            let w = '';
            let c = '';
            val = val ? val.trim() : '';

            if (typeof params.width !==  'undefined') {
                w = 'width:' + (parseInt(params.width) - this.$dummyTD.prop('padding-left') - 6 - this.$dummyTD.prop('padding-right')- 6 - this.$dummyTD.prop('border-right-width') * 2 - 2) + 'px;';
            }

            if (typeof params.type ===  'undefined') {
                params.type = 'text';
            }

            if (selected) {
                c = ' class="selected" ';
            }

            return '<td' + c + '><div class="cText' 
                + (data && typeof data.error !== 'undefined' && data.error != '' ? ' error' : '') + '" style="'
                + w + 'word-wrap:break-word;padding-left:6px;padding-right:6px;padding-top:6px;padding-bottom:6px;margin-left:0;margin-right:0;border:1px dotted transparent" data-error="' 
                + (data && data.error ? data.error.replace('"',"'").replace(/<|>/g, '') :'')  
                + '" data-status="' + (data && data.status ? data.status.replace('"',"'").replace(/<|>/g, '') : '') 
                + '" data-tip="' + (data && data.tip ? data.tip.replace('"', "'").replace(/<|>/g, '') : ''  ) + '" >'
                + (val == '' ? '&nbsp;' : val) + '</div></td>';
        }

        #setEvents() {
            const self = this;
            // TH
            this.$header.on('mouseenter', 'th', function (e) {
                eee.q(this).addClass('hover').find('.column-sort').css('opacity',1);  
            }, true).on('mouseleave', 'th', function (e) {
                const $cs = eee.q(this).removeClass('hover').find('.column-sort');
                !$cs.hasClass('column-sort-idle') || $cs.css('opacity', 0.3);  
            }, true).on('delete', 'th', function (e) {
                if (!self.settings.thOnDelete.call(this, e, self)) return; 
            }).on('mousedown', '.column-title', function (e) {
                if (self.settings.enableColumnSelection) {
                    const $th = eee.q(this).closest('th');
                    const idx = $th.prevUntil().length();
                    $th.hasClass('selected') ? $th.removeClass('selected') : $th.addClass('selected');
                    $th.siblings('th').removeClass('selected');
                    self.$body.find('tbody tr').each(function () {
                        const $td = eee.q(this).find('td').removeClass('selected');
                        if ($th.hasClass('selected')) {
                            $td.eq(idx).addClass('selected');
                        }
                    });
                }
                return self.settings.thOnClick.call(this, e, self);
            }).on('click', 'span.column-sort', function () {
                const $sortItem = eee.q(this); 
                const $th = $sortItem.parent().parent();
                const backupScrollPosLeft = self.$body.parent().get().scrollLeft; 
                const backupScrollPosTop = self.$body.parent().get().scrollTop; 
                let thData = $th.data('params'); 
                
                if (self.settings.sortField == thData.field) {
                    self.settings.sortOrder = !(parseInt(self.settings.sortOrder)) ? 1 : 0;
                    self.settings.sortOrder ? $sortItem.removeClass('column-sort-down').addClass('column-sort-up').addAttr('title', 'Up') : $sortItem.removeClass('column-sort-up').addClass('column-sort-down').addAttr('title', 'Down');
                } else {
                    self.settings.sortField = thData.field;
                    self.settings.sortOrder = 1;
                    $th.siblings().find('.column-sort').removeClass('column-sort-up').removeClass('column-sort-down').addClass('column-sort-idle').addAttr('title', 'Sort');
                    $sortItem.removeClass('column-sort-idle').addClass('column-sort-up').addAttr('title', 'Up');
                } 

                self.showOverlay(); 

                self.getRequest(
                    self.settings.ajaxGet + '?r=' + rand(1000,10000000),
                    self.makeRequestParams('get', self.settings.id, self.ajaxParams),
                    function (data) {
                        self.setRows(data);
                        self.hideOverlay();
                        self.$body.parent().get().scrollLeft = backupScrollPosLeft;
                        self.$body.parent().get().scrollTop = backupScrollPosTop;
                    }
                )
            }).on('dblclick', '.column-title', function (e) {
                return self.settings.thOnDblClick.call(this, e, self);
            }, true);;
            
            if (self.settings.editable) {
              this.$header.on('edit', 'th', function (e) {
                  return self.settings.tdOnEdit.call(this, e, self);
              });
            } 

            // TD
            this.$body.on('click', 'td', function (e) {
                return self.settings.tdOnClick.call(this, e, self);
            }).on('mouseenter', 'td', function (e) {
                eee.q(this).addClass('hover'); 
            }, true).on('mouseleave', 'td', function (e) { 
                eee.q(this).removeClass('hover');
            }, true).on('dblclick', 'td', function (e) {
                return self.settings.tdOnDblClick.call(this, e, self);
            });
            
            if (self.settings.editable) {
              this.$body.on('edit', '.cText', function(e) {
                  return self.settings.tdOnEdit.call(this, e, self);
              });
            }

            // TR
            this.$body.on('mouseenter', 'tbody tr', function () {
                eee.q(this).addClass('hover'); 
            }, true).on('mouseleave', 'tbody tr', function () {
                eee.q(this).removeClass('hover');
            }, true).on('delete', 'tbody tr', function (e) {
                if (!self.settings.trOnDelete.call(this, e, self)) return; 
            });/*.on('click', 'tbody tr', function(e){
                if(self.settings.enableRowSelection) {
                    var tr = $(this).addClass('selected');
                    e.altKey || tr.siblings().removeClass('selected');
                }
            });*/
            
            // sortable
            this.#makeHeaderSortable();
            
            this.events = true;  
        }
        
        #paginationEvents(pagination) {
            const self = this;
            pagination.on('click', 'a', function (e) {
                const $nav = eee.q(this);
                self.showOverlay();

                self.getRequest(
                    self.settings.ajaxGet + '?r=' + rand(1000,10000000),
                    self.makeRequestParams('get', self.settings.id, {...self.ajaxParams, ...{'data[page]': $nav.getAttr('rel')}}),
                    function (data) {
                        self.settings.total   = data.total ?? self.settings.total;
                        self.settings.perpage = data.perpage ?? self.settings.perpage;
                        self.settings.page    = data.page ?? self.settings.page;
                        self.settings.id      = data.id ?? self.settings.id;
                        self.setRows(data);
                        self.pagination(eee.q(self.settings.container).find('.pagination'));
                        self.hideOverlay(); 
                    } 
                );
            });
        }
        
        #dynamicPageLoading(page) {
            const self = this; 
            if (this.lock) return;
            this.lock = true;
            this.showOverlay();

            this.getRequest(
                this.settings.ajaxGet + '?r=' + rand(1000,10000000),
                this.makeRequestParams('get', this.settings.id, {...this.ajaxParams, ...{'data[page]': page}}),
                function (data) {
                    self.settings.total = data.total ?? self.settings.total;
                    self.settings.perpage = data.perpage ?? self.settings.perpage;
                    self.settings.page = data.page ?? self.settings.page;
                    self.settings.id = data.id ?? self.settings.id;
                    self.setRows(data, true);
                    self.hideOverlay(); 
                    self.lock = false;
                }  
            );
        }
        
        #makeHeaderSortable() {
            const self = this;
            if (!this.settings.sortableColumn) {
                return;
            }
            
            let dragEl = null;
            const $tr = this.$header.find('tr');

            $tr.event('dragstart', function (e) {
                    const $el = eee.q(e.target);
                    dragEl = e.target;
                    $el.addClass('dragging').data('oldIndex', $el.childIndex());
                })
                .event('dragend', function (e) {
                    const $el = eee.q(e.target);
                    const oldI = $el.data('oldIndex');
                    const newI = $el.childIndex();
                    $el.removeClass('dragging');
                    $tr.find('th').each(el => el.classList.remove('over'));
                    dragEl = null;
                    if (oldI === newI) {
                        return;
                    }
                    self.$body.find('tr').each((el) => {
                        const $td = eee.q(el).find('td');
                        const oTd = $td.eq(oldI).get();
                        const nTd = $td.eq(newI).get();
                        const cloneEl = oTd.cloneNode(true);
                        oTd.remove();
                        el.insertBefore(cloneEl, newI > oldI ? nTd.nextSibling : nTd);
                    });
                    const s = [];
                    $tr.find('th').each((el, i) => s.push('s[]=' + el.getAttribute('id').replace('s-', '')));
                    self.postRequest(self.settings.ajaxSort, self.makeRequestParams('sort', s.join('&'), {}));
                })
                .event('dragover', function (e) {
                    e.preventDefault();
                    const dragOverEl = self.#getDragAfterHorizontalElement($tr.get(), 'th', e.clientX);
                    $tr.find('th').each(el => el.classList.remove('over'));
                    if (dragOverEl) {
                        dragEl.classList.add('over');
                        $tr.get().insertBefore(dragEl, dragOverEl);
                    } else {
                        $tr.get().appendChild(dragEl); 
                    }
                });
        }

        #getDragAfterHorizontalElement(container, selector, x) {
            const draggableElements = [...container.querySelectorAll(selector + ':not(.dragging)')];
        
            return draggableElements.reduce(
                (closest, child) => {
                    const box = child.getBoundingClientRect();
                    const offset = x - box.left - box.width / 2;
                    if (offset < 0 && offset > closest.offset) {
                        return {offset: offset, element: child};
                    } else {
                        return closest;
                    }
                }, 
                { offset: Number.NEGATIVE_INFINITY }
            ).element;
        }
        
    }

    return {
        init: init,
    }
})(el);
