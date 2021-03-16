import { $ } from "./jquery-lib";
import { ApiService } from "./equal-services";

import View from "./View";
import Layout from "./Layout";

/**
 * Class for Model intercations
 * Acts like server-side Collection.class.php
 */
export class Model {

    private view: View;
    
    // Collection (array) of objects (we use array to maintain objects order)
    private objects: any[];

    // Map for keeping track of the fields that have been changed, on an object basis (keys are objects ids)
    private has_changed: any;

    // total objects matching the current domain on the back-end
    private total: number;

    private loaded_promise: any;


    
    // Collecitons do not deal with lang: it is used in ApiService set in the environment var
    
    constructor(view:View) {
        this.view = view;

        this.loaded_promise = $.Deferred();

        this.has_changed = {};
        this.objects = [];
        this.total = 0;
    }
    

    public async init() {
        
        try {            
            await this.refresh();
        }
        catch(err) {
            console.log('Something went wrong ', err);
        }        
        
    }
        
    public hasChanged() : boolean {
        return (Object.keys(this.has_changed).length > 0);
    }

    /** 
     * Update model by requesting data from server using parent View parameters
    */
    public async refresh() {
        console.log('Model::refresh');

        // fetch fields that are present in the parent View 
        let fields: any[] = <[]>Object.keys(this.view.getViewFields());
        let schema = this.view.getModelFields();

        // append `name` subfield for relational fields, using the dot notation
        for(let i in fields) {
            let field = fields[i];
            if(['many2one', 'one2many', 'many2many'].indexOf(schema[field]['type']) > -1) {
                fields[i] = field + '.name';
            }
        }


        try {
            this.objects = await ApiService.collect(this.view.getEntity(), this.view.getDomain(), fields, this.view.getOrder(), this.view.getSort(), this.view.getStart(), this.view.getLimit(), this.view.getLang());
            
            this.loaded_promise.resolve();
            this.total = ApiService.getLastCount();

            // trigger model change handler in the parent View (in order to update the layout)
            await this.view.onchangeModel();
        }
        catch(err) {
            console.log('Unable to fetch Collection from server', err);
        }        
        
    }
    
    /**
     * React to external request of Model change (one ore more objects in the collection have been updated through the Layout).
     * Changes are made on a field basis.
     * 
     */
    public change(ids: Array<any>, values: any) {
        console.log('Model::change', ids, values);
        for (let index in this.objects) {
            let object = this.objects[index];
            for (let id of ids) {
                if(object.hasOwnProperty('id') && object.id == id) {
                    for (let field in values) {
                        if(object.hasOwnProperty(field)) {
                            if(!this.has_changed.hasOwnProperty(id)) {
                                this.has_changed[id] = [];
                            }
                            // update field
                            this.objects[index][field] = values[field];
                            // mark field as changed
                            this.has_changed[id].push(field);
                        }
                    }    
                }
            }
        }
        console.log('##########################', this.objects)        ;        
    }
    
    public ids() {
        return this.objects.map( (object:any) => object.id );
    }

    /**
     * Return the Collection.
     * The result set can be limited to a subset of specific objects by specifying an array of ids.
     * 
     * @param ids array list of objects identifiers that must be returned
     */
    public get(ids:any[] = []) {
        let promise = $.Deferred();
        this.loaded_promise.
        then( () => {
            if(ids.length) {
                // create a custom collection by filtering objects on their ids
                promise.resolve( this.objects.filter( (object:any) => ids.indexOf(+object['id']) > -1 ) );                
            }
            else {
                // return the full collection
                promise.resolve(this.objects);
            }            
        })
        .catch( () => promise.resolve({}) );

        return promise;
    }

    /**
     * Returns a collection holding only modified objects with their modified fields.
     * The collection will be empty if no changes occured.
     * 
     * @param ids array list of objects identifiers that must be returned (if changed)
     */
    public getChanges(ids:any[] = []) {
        let collection = [];
        for(let id in this.has_changed) {
            if(ids.length && ids.indexOf(+id) < 0) continue;
            let fields = this.has_changed[id];
            let object = this.objects.find( (object:any) => object.id == id );
            if(object == undefined) continue;
            let result:any = {id: id};
            for(let field of fields) {
                result[field] = object[field];
            }
            // force appending `state`and `modified` fields (when present) for concurrency control
            if(object.hasOwnProperty('modified')) {
                result['modified'] = object.modified;
            }
            if(object.hasOwnProperty('state')) {
                result['state'] = object.state;
            }
            collection.push(result);
        }
        return collection;
    }

    public getTotal() {
        return this.total;
    }
}

export default Model;