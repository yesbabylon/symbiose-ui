import { Component, OnInit, AfterViewInit, OnChanges, Output, Input, ElementRef, EventEmitter, SimpleChanges, SimpleChange, ViewChild, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {MatAutocomplete, MatAutocompleteTrigger} from '@angular/material/autocomplete';

import { fromEvent, Observable, ReplaySubject, Subject } from 'rxjs';
import { map, mergeMap, debounceTime, startWith, takeUntil } from 'rxjs/operators';

import { ApiService } from '../../services/api.service';
import { Condition, Domain } from '../../classes/domain.class';
import { splitAtColon } from '@angular/compiler/src/util';

@Component({
  selector: 'sb-m2o-select',
  templateUrl: './sb-m2o-select.component.html',
  styleUrls: ['./sb-m2o-select.component.scss']
})
export class SbMany2OneSelectComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    // full name of the entity to load
    @Input() entity: string = '';
    // id of the object to load as preset value
    @Input() id: number = 0;
    // extra fields to load (in addition to 'id', 'name')
    @Input() fields?: string[] = [];
    // additional domain for filtering result set
    @Input() domain?: any[] = [];
    // specific controller to use for fetching data
    @Input() controller?: string = '';
    // extra parameter specific to the chosen controller
    @Input() params?: any = {};
    // mark the field as mandatory
    @Input() required?: boolean = false;
    // specific placeholder of the widget
    @Input() placeholder?: string = '';
    // specific hint/helper for the widget
    @Input() hint?: string = '';
    // flag for giving the focus to native input element
    @Input() autofocus?: boolean = false;
    // message to display in case no match was found
    @Input() noResult?: string = '';
    // mark the field as readonly
    @Input() disabled?: boolean = false;
    // custom method for rendering the items
    @Input() displayWith?: (a:any) => string;
    // css value for panel width (dropdown)
    @Input() panelWidth?: string = 'auto';
    // load a first batch of possible choice when giving focus to component
    @Input() preloadOnFocus?: boolean = false;

    @Output() itemSelected: EventEmitter<number> = new EventEmitter<number>();
    @Output() blur: EventEmitter<any> = new EventEmitter();

    @ViewChild('inputControl') inputControl: ElementRef;
    @ViewChild('inputAutocomplete') inputAutocomplete: MatAutocomplete;
    @ViewChild(MatAutocompleteTrigger) trigger!: MatAutocompleteTrigger;

    private destroy$ = new Subject<void>();

    // currently selected item
    public item: any = null;

    public inputFormControl: FormControl;
    public resultList: Observable<any>;

    private inputQuery: ReplaySubject<any>;

    constructor(private api: ApiService) {
        this.inputFormControl = new FormControl();
        this.inputQuery = new ReplaySubject(1);
    }

    ngAfterViewInit() {
        if(!this.disabled && this.autofocus) {
            setTimeout( () => this.inputControl.nativeElement.focus() );
        }

        const sync = () => {
            const el = this.inputControl?.nativeElement;
            if(!el) {
                return;
            }
            if(this.panelWidth === 'auto') {
                this.panelWidth = el.getBoundingClientRect().width;
                this.trigger?.updatePosition();
            }
        };

        // initial + on resize
        fromEvent(window, 'resize')
            .pipe(startWith(0), takeUntil(this.destroy$))
            .subscribe(sync);
    }

    ngOnInit(): void {

        // watch changes made on input
        this.inputFormControl.valueChanges.subscribe( (value:string)  => {
            if(!this.item || this.item != value) {
                this.inputQuery.next(value);
            }
        });

        // update autocomplete result list
        this.resultList = this.inputQuery.pipe(
            debounceTime(300),
            map( (value:any) => (typeof value === 'string' ? value : ( (value == null) ? '' : value.name ) )),
            mergeMap( async (name:string) => await this.filterResults(name) )
        );
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Update component based on changes received from parent.
     *
     * @param changes
     */
    ngOnChanges(changes: SimpleChanges) {
        let has_changed = false;

        const currentId: SimpleChange = changes.id;
        const currentEntity: SimpleChange = changes.entity;

        if(changes.required) {
            if(this.required) {
                this.inputFormControl.setValidators([Validators.required]);
                this.inputFormControl.markAsTouched();
            }
            this.inputFormControl.updateValueAndValidity();
        }

        if(currentId && currentId.currentValue && currentId.currentValue != currentId.previousValue) {
            has_changed = true;
        }

        if(currentEntity && currentEntity.currentValue && currentEntity.currentValue != currentEntity.previousValue) {
            has_changed = true;
        }

        if(has_changed) {
            this.load();
        }
    }


    /**
     * Load initial values, based on inputs assigned by parent component.
     *
     */
    private async load() {
        if(this.id && this.id > 0 && this.entity && this.entity.length) {
            try {
                const result:Array<any> = <Array<any>> await this.api.read(this.entity, [this.id], ['id', 'name', ...this.fields]);
                if(result && result.length) {
                    this.item = result[0];
                    this.inputFormControl.setValue(this.item);
                }
            }
            catch(error:any) {
                console.warn('an unexpected error occured');
            }
        }
    }

    private async filterResults(name: string) {
        let filtered: any[] = [];
        if(this.entity.length && (!this.item || this.item.name != name) ) {
            try {
                let tmpDomain = new Domain([]);
                if(name.length) {
                    let parts = name.split(' ', 4);
                    for(let part of parts) {
                        tmpDomain.addCondition(new Condition('name', 'ilike', '%' + part + '%'));
                    }
                }
                let domain = (new Domain(this.domain)).merge(tmpDomain).toArray();

                let data:any[];

                if(this.controller && this.controller.length) {
                    let body:any = {
                        get: this.controller,
                        entity: this.entity,
                        fields: ['id', 'name', ...this.fields],
                        domain: JSON.stringify(domain),
                        ...this.params
                    };

                    // fetch objects using controller given by View (default is core_model_collect)
                    data = await this.api.fetch('/', body);
                }
                else {
                    data = await this.api.collect(this.entity, domain, ["id", "name", ...this.fields], 'name', 'asc', 0, 25);
                }

                filtered = data;
            }
            catch(error:any) {
                console.warn(error);
            }
        }
        return filtered;
    }

    public itemDisplay = (item:any): string => {
        if(!item) {
            return '';
        }
        if(this.displayWith) {
            return this.displayWith(item);
        }
        return item.name;
    }

    public onChange(event:any) {
        if(event && event.option && event.option.value) {
            this.item = event.option.value;
            this.inputFormControl.setValue(this.item);
            this.itemSelected.emit(this.item);
        }
    }

    public onFocus() {
        // force triggering a list refresh
        if(this.preloadOnFocus && !this.inputFormControl.value) {
            this.inputFormControl.setValue('');
        }
    }

    public onReset() {
        this.inputFormControl.setValue(null);
    }

    public onBlur() {
        if(!this.inputAutocomplete.isOpen) {
            this.blur.emit();
            this.onRestore();
        }
        else {
            console.debug('sb-m2o-select: autocomplete open ignoring blur');
        }
    }

    public onRestore() {
        if(this.item) {
            this.inputFormControl.setValue(this.item);
        }
        else {
            this.inputFormControl.setValue(null);
        }
    }

    public oncloseAutocomplete() {
        // #memo - input.onBlur is called before mat-autocomplete.onChange
        if(!this.inputFormControl.value || !this.item) {
            this.blur.emit();
        }
    }

}