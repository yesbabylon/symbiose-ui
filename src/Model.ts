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
    
    // Collection (map) of objects: objects ids mapping related objects
    private objects: any;




    
    
    // Collecitons do not deal with lang: it is used in ApiService set in the environment var
    
    constructor(view:View) {
        this.view = view;

        
        this.objects = {};
        
    }
    

    public async init() {
        
        try {            
            this.refresh();
        }
        catch(err) {
            console.log('something went wrong ', err);
        }        
        
    }
        
    public async refresh() {
        console.log('Model::refresh');

        let fields: [] = <[]>Object.keys(this.view.getFields());

        try {
            this.objects = await ApiService.collect(this.view.getEntity(), this.view.getDomain(), fields, this.view.getOrder(), this.view.getSort(), this.view.getStart(), this.view.getLimit(), this.view.getLang());

            console.log(this.objects);
            // trigger model change handler in the parent View (in order to update the layout)
            this.view.onchangeModel();
        }
        catch(err) {
            console.log('Unable to fetch Collection from server', err);
        }        
        
    }
    
    /**
     * React to external request of Model change (one ore more objects in the collection have been updated through the Layout)
     */
    public update(ids: [], values: any) {
        for (let id of ids) {
            if(this.objects.hasOwnProperty(id)) {
                for (let field in values) {                    
                    if(this.objects[id].hasOwnProperty(field)) {
                        this.objects[id][field] = values[field];
                    }
                }
            }
        }
    }
    
    public ids() {
        return Object.keys(this.objects);
    }

    /**
     * >Return the entire Collectiono
     *
     */
    public get() {
        return this.objects;
    }
    
}

export default Model;