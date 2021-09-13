import Widget from "./Widget";
import Layout from "../Layout";

import { UIHelper } from '../material-lib';


export default class WidgetBoolean extends Widget {

    constructor(layout: Layout, label: string, value: any, config: {}) {
        super(layout, 'boolean', label, value, config);
    }

    public setValue(value: any) {
        super.setValue(value);
        this.$elem.find('input').val(value).trigger('change');
        return this;
    }

    public render():JQuery {

        switch(this.mode) {
            case 'edit':
                this.$elem = UIHelper.createSwitch('', this.label, this.value, this.config.helper, '', this.readonly);

                // setup handler for relaying value update to parent layout
                this.$elem.find('input')
                .on('change', (event:any) => {
                    let $this = $(event.currentTarget);
                    this.value = $this.prop( "checked" )
                    this.$elem.trigger('_updatedWidget');
                });
                break;
            case 'view':
            default:
                /*
                let value:string = (this.value)?'true':'false';
                $elem = UIHelper.createInputView('', this.label, value);
                */
                this.$elem = UIHelper.createSwitch('', this.label, this.value, this.config.helper, '', true);
                break;
        }
        return this.$elem.addClass('sb-widget').addClass('sb-widget-type-boolean').addClass('sb-widget-mode-'+this.mode).attr('id', this.getId());
    }
    
}