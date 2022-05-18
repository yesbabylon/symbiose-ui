import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ChangeDetectorRef, ViewChildren, QueryList, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { ApiService, ContextService, TreeComponent } from 'sb-shared-lib';
import { BookingLineGroup } from '../../../../_models/booking_line_group.model';
import { BookingLine } from '../../../../_models/booking_line.model';
import { Booking } from '../../../../_models/booking.model';
import { Observable, ReplaySubject } from 'rxjs';
import { debounceTime, map, mergeMap } from 'rxjs/operators';

import { BookingServicesBookingGroupLineDiscountComponent } from './_components/discount/discount.component';

// declaration of the interface for the map associating relational Model fields with their components
interface BookingLineComponentsMap {
    manual_discounts_ids: QueryList<BookingServicesBookingGroupLineDiscountComponent>
};

interface vmModel {
    product: {
        name: string
        inputClue: ReplaySubject < any > ,
        filteredList: Observable < any > ,
        inputChange: (event: any) => void,
        focus: () => void,
        restore: () => void,
        reset: () => void,
        display: (type: any) => string
    },
    qty: {
        formControl: FormControl,
        change: () => void
    },
    qty_vars: {
        values: any,
        change: (index: number, event: any) => void,
        reset: () => void
    },
    unit_price: {
        formControl: FormControl
    },
    vat: {
        formControl: FormControl,
        change: () => void
    },
    total_price: {
        value: number
    }
}

@Component({
    selector: 'booking-services-booking-group-line',
    templateUrl: 'line.component.html',
    styleUrls: ['line.component.scss']
})
export class BookingServicesBookingGroupLineComponent extends TreeComponent<BookingLine, BookingLineComponentsMap> implements OnInit, OnChanges, AfterViewInit  {
    // server-model relayed by parent
    @Input() set model(values: any) { this.update(values) }
    @Input() group: BookingLineGroup;
    @Input() booking: Booking;
    @Output() updated = new EventEmitter();
    @Output() deleted = new EventEmitter();


    @ViewChildren(BookingServicesBookingGroupLineDiscountComponent) BookingServicesBookingGroupLineDiscountComponents: QueryList<BookingServicesBookingGroupLineDiscountComponent>;

    public ready: boolean = false;

    public vm: vmModel;

    constructor(
        private cd: ChangeDetectorRef,
        private api: ApiService,
        private context: ContextService
    ) {
        super( new BookingLine() );

        this.vm = {
            product: {
                name:           '',
                inputClue:      new ReplaySubject(1),
                filteredList:   new Observable(),
                inputChange:    (event:any) => this.productInputChange(event),
                focus:          () => this.productFocus(),
                restore:        () => this.productRestore(),
                reset:          () => this.productReset(),
                display:        (type:any) => this.productDisplay(type)
            },
            qty: {
                formControl:    new FormControl('', Validators.required),
                change:         () => this.qtyChange()
            },
            qty_vars: {
                values:         {},
                change:         (index:number, event:any) => this.qtyVarsChange(index, event),
                reset:          () => this.qtyVarsReset()
            },
            unit_price: {
                formControl:    new FormControl('')
            },
            vat: {
                formControl:    new FormControl(''),
                change:         () => this.vatChange()
            },
            total_price: {
                value:          0.0
            }
        };
    }


    public ngOnChanges(changes: SimpleChanges) {
        if(changes.model) {
            let factor:number = this.group.nb_nights;

            if(this.instance.product_id.product_model_id.has_duration) {
                factor = this.instance.product_id.product_model_id.duration;
            }

            let values = new Array(factor);

            values.fill(0);
            if(this.instance.qty_vars.length) {
                values = JSON.parse(this.instance.qty_vars);
            }
            let i = 0;
            for(let val of values) {
                this.vm.qty_vars.values[i] = val;
                ++i;
            }
        }
    }

    public ngAfterViewInit() {
        // init local componentsMap
        let map:BookingLineComponentsMap = {
            manual_discounts_ids: this.BookingServicesBookingGroupLineDiscountComponents,
        };
        this.componentsMap = map;
    }


    public ngOnInit() {
        this.ready = true;

        // listen to the changes on FormControl objects
        this.vm.product.filteredList = this.vm.product.inputClue.pipe(
            debounceTime(300),
            map( (value:any) => (typeof value === 'string' ? value : (value == null)?'':value.name) ),
            mergeMap( async (name:string) => this.filterProducts(name) )
        );
    }

    public async update(values:any) {
        console.log('line update', values);
        super.update(values);
        // assign VM values
        this.vm.product.name = this.instance.name;
        this.vm.total_price.value = this.instance.price;
        // qty
        this.vm.qty.formControl.setValue(this.instance.qty);
        // unit_price
        this.vm.unit_price.formControl.setValue(this.instance.unit_price);
        // vat

        this.vm.vat.formControl.setValue(this.instance.vat_rate);
    }

    public async ondeleteLine(line_id:number) {
        await this.api.update(this.instance.entity, [this.instance.id], {order_lines_ids: [-line_id]});
        this.instance.order_lines_ids.splice(this.instance.order_lines_ids.findIndex((e:any)=>e.id == line_id),1);
        // do not relay to parent
    }

    private productInputChange(event:any) {
        this.vm.product.inputClue.next(event.target.value);
    }

    private productFocus() {
        this.vm.product.inputClue.next("");
    }

    private productDisplay(product:any): string {
        return product ? product.name: '';
    }

    private productReset() {
        setTimeout( () => {
            this.vm.product.name = '';
        }, 100);
    }

    private productRestore() {
        if(this.instance.product_id) {
            this.vm.product.name = this.instance.product_id.name;
        }
        else {
            this.vm.product.name = '';
        }
    }

    public async onchangeProduct(event:any) {
        console.log('BookingEditCustomerComponent::productChange', event)

        // from mat-autocomplete
        if(event && event.option && event.option.value) {
            let product = event.option.value;
            this.vm.product.name = product.name;
            // notify back-end about the change
            try {
                await this.api.update(this.instance.entity, [this.instance.id], {product_id: product.id});
                // relay change to parent component
                this.updated.emit();
            }
            catch(response) {
                this.api.errorFeedback(response);
            }
        }
    }

    private async qtyChange() {
        // notify back-end about the change
        try {
            await this.api.update(this.instance.entity, [this.instance.id], {qty: this.vm.qty.formControl.value});
            // relay change to parent component
            this.updated.emit();
        }
        catch(response) {
            this.api.errorFeedback(response);
        }
    }

    private async qtyVarsChange(index:number, $event:any) {
        let value:number = parseInt($event.srcElement.value, 10);
        this.vm.qty_vars.values[index] = (value-this.group.nb_pers);
        // update line
        let qty_vars = JSON.stringify(Object.values(this.vm.qty_vars.values));
        // notify back-end about the change
        try {
            await this.api.update(this.instance.entity, [this.instance.id], {qty_vars: qty_vars});
            // relay change to parent component
            this.updated.emit();
        }
        catch(response) {
            this.api.errorFeedback(response);
        }
    }

    private async qtyVarsReset() {
        this.vm.qty_vars.values = new Array(this.group.nb_nights);
        this.vm.qty_vars.values.fill(0);
        let qty_vars = JSON.stringify(Object.values(this.vm.qty_vars.values));
        // notify back-end about the change
        try {
            await this.api.update(this.instance.entity, [this.instance.id], {qty_vars: qty_vars});
            // relay change to parent component
            this.updated.emit();
        }
        catch(response) {
            this.api.errorFeedback(response);
        }
    }

    public async onchangeUnitPrice() {
        // notify back-end about the change
        try {
            await this.api.update(this.instance.entity, [this.instance.id], {unit_price: this.vm.unit_price.formControl.value});
            // relay change to parent component
            this.updated.emit();
        }
        catch(response) {
            this.api.errorFeedback(response);
        }
    }

    private async vatChange() {
        // notify back-end about the change
        try {
            await this.api.update(this.instance.entity, [this.instance.id], {vat_rate: this.vm.vat.formControl.value});
            // relay change to parent component
            this.updated.emit();
        }
        catch(response) {
            this.api.errorFeedback(response);
        }
    }

    /**
     * Limit products to the ones available for currently selected center (groups of the product matches the product groups of the center)
     */
    private async filterProducts(name: string) {

        let filtered:any[] = [];
        try {
            let domain = [
                ["name", "ilike", '%'+name+'%'],
                ["can_sell", "=", true]
            ];

            if(Array.isArray(this.booking.center_id.product_groups_ids) && this.booking.center_id.product_groups_ids.length) {
                domain.push(["groups_ids", "contains", this.booking.center_id.product_groups_ids[0]]);
            }

            let data:any[] = await this.api.collect(
                "lodging\\sale\\catalog\\Product",
                domain,
                ["id", "name", "sku"],
                'name', 'asc', 0, 25
            );
            filtered = data;
        }
        catch(response) {
            console.log(response);
        }
        return filtered;
    }


    /**
     * Add a manual discount
     */
    public async oncreateDiscount() {
        try {
            const adapter = await this.api.create("lodging\\sale\\booking\\BookingPriceAdapter", {
                booking_id: this.booking.id,
                booking_line_group_id: this.group.id,
                booking_line_id: this.instance.id
            });

            let discount = {id: adapter.id, type: 'percent', value: 0};
            this.instance.manual_discounts_ids.push(discount);
        }
        catch(response) {
            this.api.errorFeedback(response);
        }
    }

    public async ondeleteDiscount(discount_id: any) {    
        try {
            this.instance.manual_discounts_ids.splice(this.instance.manual_discounts_ids.findIndex((e:any)=>e.id == discount_id),1);
            await this.api.update(this.instance.entity, [this.instance.id], {manual_discounts_ids: [-discount_id]});
            this.updated.emit();            
        }
        catch(response) {
            this.api.errorFeedback(response);
        }

    }

    public async onupdateDiscount(discount_id:any) {
        this.updated.emit();
    }

}