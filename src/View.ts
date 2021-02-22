import { $ } from "./jquery-lib";
import { UIHelper, MDCMenu } from './material-lib';

import { ApiService } from "./equal-services";

import Context from "./Context";
import Layout from "./Layout";
import Model from "./Model";



export class View {

    public context: any;
    public entity: string;
    public type: string; 
    public name: string;


    // View holds the params for search requests performed by Model
    public domain: any[];
    private order: string;
    private sort: string;    
    private start: number;
    private limit: number;
    private lang: string;

    private layout: Layout;
    private model: Model;

    private view_schema: any;
    private model_schema: any;

    // Map of fields mapping their View definitions
    private view_fields: any;
    // Map of fields mapping their Model definitions
    private model_fields: any;

    // Arrray of available filters from View definition
    private filters: any;


    // List of currently selected filters from View definition (for filterable types)    
    private applied_filters_ids: any[];

    public $headerContainer: any;
    public $layoutContainer: any;

    /**
     * 
     * @param context 
     * @param entity    entity (package\Class) to be loaded: should be set only once (depend on the related view)
     * @param type 
     * @param name 
     * @param domain 
     */
    
    constructor(context: Context, entity: string, type: string, name: string, domain: any[], lang: string) {
        this.context = context;
        this.entity = entity;
        this.type = type; 
        this.name = name;

        this.domain = domain;        
        this.order = 'id';
        this.sort = 'asc';
        this.start = 0;
        this.limit = 25;
        this.lang = lang;

        this.$headerContainer = $('<div />').addClass('sb-view-header');
        this.$layoutContainer = $('<div />');

        this.filters = {};
        this.applied_filters_ids = [];

        this.layout = new Layout(this);
        this.model = new Model(this);

        this.init();
    }

    
    public async init() {
        console.log('View::init');
        // inject View in parent Context object
        this.context.$container.append(this.$headerContainer).append(this.$layoutContainer);

        try {
            this.view_schema = await ApiService.getView(this.entity, this.type + '.' + this.name);
            this.model_schema = await ApiService.getSchema(this.entity);
            this.loadViewFields(this.view_schema);
            this.loadModelFields(this.model_schema);            
            if(this.view_schema.hasOwnProperty("filters")) {
                for(let filter of this.view_schema.filters) {
                    this.filters[filter.id] = filter;
                }
            }
            await this.layout.init();
            await this.model.init();

            if(['list', 'kanban'].indexOf(this.type) >= 0) {
                this.layoutListHeader();
            }
        }
        catch(err) {
            console.log('Unable to init view ('+this.entity+'.'+this.type+'.'+this.name+')', err);
        }
    }


    public setField(field: string, value: any) {
        this.view_fields[field] = value;
    }
    public getField(field: string) {
        return this.view_fields[field];
    }

    public setSort(sort: string) {
        this.sort = sort;
    }
    public setOrder(order: string) {
        this.order = order;
    }
    public setStart(start: number) {
        this.start = start;;
    }
    public setLimit(limit: number) {
        this.limit = limit;
    }

    public getEntity() {
        return this.entity;
    }
    public getViewSchema() {
        return this.view_schema;
    }
    public getModelSchema() {
        return this.model_schema;
    }

    /**
     * Applicable domain for the View corresponds to the parent Context domain with additional filters currently applied on the View
     */
    public getDomain() {
        console.log('View::getDomain', this.domain, this.applied_filters_ids);
        let domain = [...this.domain];
        
        for(let filter_id of this.applied_filters_ids) {
            domain.push(this.filters[filter_id].clause);
        } 
        console.log('result', domain);
        return domain;
    }
    public getSort() {
        return this.sort;
    }
    public getOrder() {
        return this.order;
    }
    public getStart() {
        return this.start;
    }
    public getLimit() {
        return this.limit;
    }
    public getLang() {
        return this.lang;
    }

    public getModel() {
        return this.model;
    }
    
    public getLayout() {
        return this.layout;
    }

    public getViewFields() {
        return this.view_fields;
    }

    public getModelFields() {
        return this.model_fields;
    }


    /**
     * Generates a list holding all fields that are present in a given view (as items objects)
     * and stores it in the `fields` member
     */
	private loadViewFields(view_schema: any) {
        console.log('View::loadFields', view_schema);
        this.view_fields = {};
        var stack = [];
        // view is valid
        if(view_schema.hasOwnProperty('layout')) {    
            stack.push(view_schema['layout']);
            var path = ['groups', 'sections', 'rows', 'columns'];
            
            while(stack.length) {
                var elem = stack.pop();
                
                if(elem.hasOwnProperty('items')) {
                    for (let item of elem['items']) { 
                        if(item.type == 'field' && item.hasOwnProperty('value')){
                            this.view_fields[item.value] = item;
                        }
                    }
                }
                else {
                    for (let step of path) { 
                        if(elem.hasOwnProperty(step)) {
                            for (let obj of elem[step]) { 
                                stack.push(obj);
                            }
                        }
                    }
                }
            }
        }
    }


	private loadModelFields(model_schema: any) {
        console.log('View::loadVModelFields', model_schema);
        this.model_fields = model_schema.fields;
    }



    private layoutListHeader() {
        // container for holding chips of currently applied filters
        let $filters_set = $('<div />').addClass('sb-view-header-filters-set mdc-chip-set').attr('role', 'grid');

        // floating menu for filters selection
        let $filters_menu = $('<ul/>').attr('role', 'menu').addClass('mdc-list');
        // button for displaying the filters menu
        let $filters_button = $('<div/>').addClass('sb-view-header-filters mdc-menu-surface--anchor')
        .append( UIHelper.createUIButton('view-filters', 'filtres', 'mini-fab', 'filter_list') )
        .append( $('<div/>').addClass('sb-view-header-filters-menu mdc-menu mdc-menu-surface').css({"margin-top": '48px'}).append($filters_menu) );
        
        for(let filter_id in this.filters) {
            let filter = this.filters[filter_id];

            UIHelper.createUIListItem(filter.description)
            .appendTo($filters_menu)
            .attr('id', filter_id)
            .on('click', (event) => {
                let $this = $(event.currentTarget);                
                $filters_set.append(
                    UIHelper.createUIChip(filter.description)
                    .attr('id', filter_id)
                    .on('click', (event) => {
                        let $this = $(event.currentTarget)
                        let index = this.applied_filters_ids.indexOf($this.attr('id'));
                        if (index > -1) {
                            this.applied_filters_ids.splice(index, 1);
                        }        
                        $this.remove();
                        this.onchangeView();
                    })
                );
                this.applied_filters_ids.push($this.attr('id'));
                this.onchangeView();
            });
        }
        let filters_menu = new MDCMenu($filters_button.find('.mdc-menu')[0]);        
        $filters_button.find('button').on('click', () => {
            filters_menu.open = !$filters_button.find('.mdc-menu').hasClass('mdc-menu-surface--open');
        });    



        // floating menu for fields selection
        let $fields_toggle_menu = $('<ul/>').attr('role', 'menu').addClass('mdc-list');
        // button for displaying the fields menu
        let $fields_toggle_button = $('<div/>').addClass('sb-view-header-fields_toggle mdc-menu-surface--anchor')        
        .append( UIHelper.createUIButton('view-filters', 'fields', 'mini-fab', 'more_vert') )
        .append( $('<div/>').addClass('sb-view-header-fields_toggle-menu mdc-menu mdc-menu-surface').append($fields_toggle_menu) );

        $.each(this.getViewSchema().layout.items, (i, item) => {            
            let label = (item.hasOwnProperty('label'))?item.label:item.value.charAt(0).toUpperCase() + item.value.slice(1);
            let visible = (item.hasOwnProperty('visible'))?item.visible:true;

            UIHelper.createUIListItemCheckbox('sb-fields-toggle-checkbox-'+item.value, label)
            .appendTo($fields_toggle_menu)
            .find('input')
            .on('change', (event) => {
                let $this = $(event.currentTarget);
                let def = this.getField(item.value);
                def.visible = $this.prop('checked');
                console.log(def);
                this.setField(item.value, def);
                this.onchangeModel(true);
            })
            .prop('checked', visible);

        });
        let fields_toggle_menu = new MDCMenu($fields_toggle_button.find('.mdc-menu')[0]);        
        $fields_toggle_button.find('button').on('click', () => {
            fields_toggle_menu.open = !$fields_toggle_button.find('.mdc-menu').hasClass('mdc-menu-surface--open');
        });    


        // attach elements to header toolbar
        this.$headerContainer.append( $filters_button );
        this.$headerContainer.append( $filters_set );        
        this.$headerContainer.append( $fields_toggle_button );
    }

    
    // handle actions
    
/*    
//1) mode edit
modifications des champs (a rpriori un par un) : relayer les changementrs depuis les Widgets via le layout => adapter la Collection (object_id, values)

//2) modification du domaine / filtres : au niveau de la vue 
 


*/
  
    /**
     * Callback for requesting a Model update
     * Requested from layout when a change occured in the widgets.
     * 
     * @param ids       array   one or more objecft identifiers
     * @param values    object   map of fields names and their related values
     */
    public onchangeViewModel(ids: [], values: object) {
        this.model.update(ids, values);
    }
    
    /**
     * Callback for requesting a Layout update
     * Requested from Model when a change occured in the Collection (as consequence of domain or params update)
     */
    public onchangeModel(full: boolean = false) {
        this.layout.refresh(full);
    }
    
    /**
     * Callback for requesting a Model update
     * Requested either from view: domain has been updated
     * or from layout: context has been updated (sort column, sorting order, limit, page, ...)
     */
    public onchangeView() {
        this.model.refresh();
    }
}

export default View;