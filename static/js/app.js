(function(w, Backbone, $, _, undef) {
    /**
    Backbone tastypie
    */
    Backbone.Tastypie = {
        apiKey: {
            username: '',
            key: ''
        },
        constructSetUrl: function( ids ) {
            return 'set/' + ids.join( ';' ) + '/';
        },
        csrfToken: '',
        defaultOptions: {},
        doGetOnEmptyPostResponse: true,
        doGetOnEmptyPutResponse: false,
        idAttribute: 'resource_uri'
    };

    Backbone.oldSync = Backbone.sync;
    Backbone.sync = function( method, model, options ) {
        var headers = {},
            options = _.defaults( options || {}, Backbone.Tastypie.defaultOptions );

        // Keep `headers` for a potential second request
        headers = _.extend( headers, options.headers );
        options.headers = headers;

        if ( ( method === 'create' && Backbone.Tastypie.doGetOnEmptyPostResponse ) ||
            ( method === 'update' && Backbone.Tastypie.doGetOnEmptyPutResponse ) ) {
            var dfd = new $.Deferred();

            // Set up 'success' handling
            var success = options.success;
            dfd.done( function( resp, textStatus, xhr ) {
                _.isFunction( success ) && success( resp );
            });

            options.success = function( resp, textStatus, xhr ) {
                // If create is successful but doesn't return a response, fire an extra GET.
                // Otherwise, resolve the deferred (which triggers the original 'success' callbacks).
                if ( !resp && ( xhr.status === 201 || xhr.status === 202 || xhr.status === 204 ) ) { // 201 CREATED, 202 ACCEPTED or 204 NO CONTENT; response null or empty.
                    options = _.defaults( {
                            url: xhr.getResponseHeader( 'Location' ) || model.url(),
                            headers: headers,
                            success: dfd.resolve,
                            error: dfd.reject
                        },
                        Backbone.Tastypie.defaultOptions
                    );
                    return Backbone.ajax( options );
                }
                else {
                    return dfd.resolveWith( options.context || options, [ resp, textStatus, xhr ] );
                }
            };

            // Set up 'error' handling
            var error = options.error;
            dfd.fail( function( xhr, textStatus, errorThrown ) {
                _.isFunction( error ) && error( xhr.responseText );
            });

            options.error = function( xhr, textStatus, errorText ) {
                dfd.rejectWith( options.context || options, [ xhr, textStatus, xhr.responseText ] );
            };

            // Create the request, and make it accessibly by assigning it to the 'request' property on the deferred
            dfd.request = Backbone.oldSync( method, model, options );
            return dfd;
        }

        return Backbone.oldSync( method, model, options );
    };

    Backbone.Model.prototype.url = function() {
        // Use the 'resource_uri' if possible
        var url = this.get( 'resource_uri' );

        // If there's no idAttribute, use the 'urlRoot'. Fallback to try to have the collection construct a url.
        // Explicitly add the 'id' attribute if the model has one.
        if ( !url ) {
            url = _.result( this, 'urlRoot' ) || ( this.collection && _.result( this.collection, 'url' ) );

            if ( url && this.has( 'id' ) ) {
                url = addSlash( url ) + this.get( 'id' );
            }
        }

        url = url && addSlash( url );

        return url || null;
    };

    Backbone.Collection.prototype.url = function( models ) {
        var url = _.result( this, 'urlRoot' );
        if ( !url ) {
            var model = models && models.length && models[ 0 ];
            url = model && _.result( model, 'urlRoot' );
        }
        url = url && addSlash( url );

        if ( models && models.length ) {
            var ids = _.map( models, function( model ) {
                var parts = _.compact( model.url().split( '/' ) );
                return parts[ parts.length - 1 ];
            });
            url += Backbone.Tastypie.constructSetUrl( ids );
        }

        return url || null;
    };

    var addSlash = function( str ) {
        return str + ( ( str.length > 0 && str.charAt( str.length - 1 ) === '/' ) ? '' : '/' );
    };

    /**
    End of Backbone tastypie
    */

    App = {
        Models: {},
        Views: {},
        Collections: {},

        run: function() {
            var router = new App.Router();
            Backbone.history.start();
        }
    };

    /**
    Table menu item
    */
    App.Views.Table = Backbone.View.extend({
        tagName: 'li',
        template: _.template($('#table-template').html()),

        initialize: function() {
            this.model.on('change', this.render, this);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    /**
    Table menu
    */
    App.Views.Tables = Backbone.View.extend({
        el: '#tables',

        initialize: function() {
            this.collection.on('add', this.append, this);
            this.collection.on('remove', this.render, this);
            this.collection.fetch();
        },

        append: function(item) {
            var itemView = new App.Views.Table({model: item});
            this.$el.append(itemView.render().el);
        },

        render: function() {
            this.$el.html('');
            this.collection.each(function(item){
                this.append(item);
            }, this);
        },
    });

    /**
    Items grid
    */
    App.Views.Grid = Backbone.View.extend({
        el: '#grid',
        table: null,
        rows: [],

        initialize: function() {
            this.collection.on('add', this.append, this);
        },

        append: function(item) {
            var row = new App.Views.Row({model: item, fields: this.table.get('fields')});
            var body = this.$el.find('tbody');
            if(body.length == 0) {
                body =$('<tbody></tbody>');
                this.$el.append(body);
            }

            body.append(row.render().el);
        },

        setTable: function(table) {
            if(!table) {
                this.clear();
                return;
            }
            this.collection.tableName = table.id;
            this.table = table;
            this.render();
            this.collection.fetch();
        },

        clear: function() {
            this.$el.html('');
        },

        render: function() {
            this.$el.html('');
            this.renderHead();
        },

        renderHead: function() {
            var head = this.$el.find('thead');
            if(head.length == 0) {
                head = $('<thead></thead>');
                this.$el.append(head);
            }
            head.html('<tr></tr>');
            var row = head.find('tr');
            var fields = this.table.get('fields');
            for(var index in fields) {
                var field = fields[index];
                field.width = 100 / fields.length;
                var col = new App.Views.GridHead({model: fields[index]});
                row.append(col.render().el);
            }

            row.append('<th></th>');
        }
    });

    /**
    Item grid row
    */
    App.Views.Row = Backbone.View.extend({
        tagName: 'tr',
        fields: [],
        template: _.template($('#row').html()),

        events: {
            'click a.remove': 'remove',
        },

        initialize: function(options) {
            this.fields = options.fields;
        },

        remove: function() {
            var self = this;
            this.model.destroy({
                success: function() {
                    self.$el.html("");
                    self.$el.remove();
                    delete self;
                    App.Views.Notification.success("Item removed");
                }
            });
            return false;
        },

        saveModel: function(cell) {
            var attrs = {};
            attrs[cell.options.id] = cell.value;
            this.model.save(attrs, {
                error: function(model, text) {
                    var response = JSON.parse(text);
                    App.Views.Notification.error(response.error_message);
                },
                success: function(text) {
                    App.Views.Notification.success("Item saved");
                }
            });
        },

        render: function() {
            for(var index in this.fields) {
                var field = this.fields[index];
                var col = new App.Views.Column({type: field.type, value: this.model.get(field.id), id: field.id});
                col.on('update', this.saveModel, this);
                this.$el.append(col.render().el);
            }

            this.$el.append('<td>' + this.template() + '</td>');

            return this;
        }
    });

    /**
    Grid row column
    */
    App.Views.Column = Backbone.View.extend({
        tagName: 'td',
        options: {},
        template: _.template($('#cell').html()),
        value: '',

        events: {
            'blur input': 'updateValue',
            'click .val': 'showEdit',
        },

        updateValue: function() {
            if($('.datepicker').is(':visible')) {
                return false;
            }
            this.value = this.$el.find('input').val();
            this.$el.find('.val').html(this.value).show();
            this.$el.find('input').hide();
            this.trigger('update', this);
            return false;
        },

        showEdit: function() {
            this.$el.find('.val').hide();
            this.$el.find('input').show().focus().val(this.value);
        },

        initialize: function(options) {
            this.options = options;
            this.value = this.options.value;
        },

        render: function() {
            var self = this;
            this.$el.html(this.template(this.options));
            if(this.options.type == 'date') {
                this.$el.find('input').datepicker({format: 'yyyy-mm-dd'}).on('hide', function() {
                    self.updateValue();
                });
            }
            return this;
        }
    });

    App.Views.GridHead = Backbone.View.extend({
        tagName: 'th',

        render: function() {
            this.$el.css('width', this.model.width + '%');
            this.$el.html(this.model.title);
            return this;
        }
    });

    App.Views.Notification = Backbone.View.extend({
        el: "#notification",

        initialize: function() {
            this.$el.width(500);
            var left = ($(w.document).width() - 500) / 2;
            this.$el.css('left', left + "px");
        },

        error: function(message) {
            this.$el.removeClass('alert-success');
            if(!this.$el.hasClass('alert-danger')) {
                this.$el.addClass('alert-danger');
            }

            this.$el.html(message);

            this.$el.show();
            var self = this;
            setTimeout(function() {
                self.$el.hide();
            }, 3000);
        },

        success: function(message) {
            this.$el.removeClass('alert-danger');
            if(!this.$el.hasClass('alert-success')) {
                this.$el.addClass('alert-success');
            }

            this.$el.html(message);

            this.$el.show();
            var self = this;
            setTimeout(function() {
                self.$el.hide();
            }, 3000);
        }
    });

    App.Views.Notification = new App.Views.Notification();

    App.Models.TableItem = Backbone.Model.extend({
    });

    App.Models.Table = Backbone.Model.extend({
    });

    App.Collections.Tables = Backbone.Collection.extend({
        urlRoot: '/tables',
        model: App.Models.Table
    });

    App.Collections.TableItems = Backbone.Collection.extend({
        urlRoot: function() {
            return '/api/v1/' + this.tableName;
        },
        tableName: null,
        model: App.Models.TableItem,

        parse: function(resp) {
            return resp.objects;
        }
    });

    App.Router = Backbone.Router.extend({
        routes: {
            '': 'index',
            'table/:id': 'loadItems',
        },
        currentTable: null,
        tables: null,
        grid: null,
        tablesCollection: null,

        initialize: function () {
            var self = this;
            $('#add-button').click(function() {
                if(self.grid && self.grid.collection != null) {
                    self.grid.collection.add(new App.Models.TableItem());
                }
                return false;
            });
            this.tablesCollection = new App.Collections.Tables();
            this.tablesCollection.on("add", this.update, this);
            this.tables = new App.Views.Tables({collection: this.tablesCollection});
            this.grid = new App.Views.Grid({collection: new App.Collections.TableItems()});
            $('#add-button').hide();
        },

        index: function() {
            $('#add-button').hide();
            this.grid.setTable(null);
        },

        update: function(item) {
            if(this.currentTable != null && item.id == this.currentTable) {
                this.loadItems(this.currentTable);
                this.currentTable = null;
            }
        },

        loadItems: function(id) {
            var table = this.tablesCollection.get(id);
            if(table != null) {
                this.grid.setTable(table);
            } else {
                this.currentTable = id;
            }
            $('#add-button').show();
        }
    });
})(window, Backbone, jQuery, _);