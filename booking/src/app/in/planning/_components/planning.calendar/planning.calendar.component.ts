import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter, ViewChild, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef, AfterViewChecked, HostBinding } from '@angular/core';

import { ChangeReservationArg } from 'src/app/model/changereservationarg';
import { HeaderDays } from 'src/app/model/headerdays';


import { ApiService, AuthService } from 'sb-shared-lib';
import {CalendarParamService} from '../../_services/calendar.param.service';


class RentalUnit {
    constructor(
        public id: number = 0,
        public name: string = '',
        public capacity: number = 0,
        public code: string = '',
        public status: string = '',
        public action_required: string = ''
    ) {}
}

@Component({
    selector: 'planning-calendar',
    templateUrl: './planning.calendar.component.html',
    styleUrls: ['./planning.calendar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanningCalendarComponent implements OnInit, AfterViewInit, AfterViewChecked {
    @Output() filters = new EventEmitter<ChangeReservationArg>();
    @Output() showBooking = new EventEmitter();
    @Output() showRentalUnit = new EventEmitter();

    // attach DOM element to compute the cells width
    @ViewChild('calTable') calTable: any;
    @ViewChild('calTableRefColumn') calTableRefColumn: any;

    @ViewChildren("calTableHeadCells") calTableHeadCells: QueryList<ElementRef>;

    public loading: boolean = false;
    public headers: any;

    public headerdays: HeaderDays;

    public cells_width: number;

    public consumptions: any = [];
    public rental_units: any = [];
    public holidays: any = [];

    public hovered_consumption: any;
    public hovered_rental_unit: any;
    public hovered_holidays: any;

    // duration history as hint for refreshing cell width
    private previous_duration: number;

    constructor(
        private params: CalendarParamService,
        private api: ApiService,
        private cd: ChangeDetectorRef) {
            this.headers = {};
            this.rental_units = [];
            this.previous_duration = 0;
    }

    async ngOnInit() {

        this.params.getObservable().subscribe( () => {
            console.log('PlanningCalendarComponent cal params change', this.params);
            this.onRefresh();
        });
    }

    async ngAfterViewInit() {
    }

    /**
     * After refreshing the view with new content, adapt header and relay new cell_width, if changed
     */
    async ngAfterViewChecked() {

        for(let cell of this.calTableHeadCells) {
            this.cells_width = cell.nativeElement.offsetWidth;
            break;
        }

        let ten_percent = this.cells_width * 0.1;
        if(ten_percent < 100) {
            // set width to 100px
            this.calTableRefColumn.nativeElement.style.width = '100px';
        }
        else {
            if(ten_percent > 200) {
                // set width to 200px
                this.calTableRefColumn.nativeElement.style.width = '200px';
            }
            else {
                // set width to 10%
                this.calTableRefColumn.nativeElement.style.width = '10%';
            }
        }

        this.cd.detectChanges();
    }

    public onRefresh() {
        console.log('onrefresh')
        this.loading = true;
        this.cd.detectChanges();
        // refresh the view, then run onchange
        setTimeout( async () => {
            await this.onFiltersChange();
            this.cd.reattach();
            this.loading = false;
            this.cd.detectChanges();
        });
    }

    public isWeekEnd(day:Date) {
        return (day.getDay() == 0 || day.getDay() == 6);
    }

    public isToday(day:Date) {
        const today = new Date();
        return (day.getDate() == today.getDate() && day.getMonth() == today.getMonth() && day.getFullYear() == today.getFullYear());
    }

    public hasConsumption(rentalUnit:RentalUnit, day: Date):any {
        let date_index:string = day.toISOString().substring(0, 10);
        return (this.consumptions.hasOwnProperty(rentalUnit.id) && this.consumptions[rentalUnit.id].hasOwnProperty(date_index));
    }

    public getConsumption(rentalUnit:RentalUnit, day: Date):any {
        let result = {};

        let date_index:string = day.toISOString().substring(0, 10);

        if(this.consumptions.hasOwnProperty(rentalUnit.id) && this.consumptions[rentalUnit.id].hasOwnProperty(date_index)) {
            result = this.consumptions[rentalUnit.id][date_index];
        }

        return result;
    }

    public getHolidayClasses(day: Date): string[] {
        let result = [];
        let date_index:string = day.toISOString().substring(0, 10);
        if(this.holidays.hasOwnProperty(date_index) && this.holidays[date_index].length) {
            result = this.holidays[date_index];
        }
        return result.map( (o:any) => o.type);
    }

    private async onFiltersChange() {

        this.createHeaderDays();

        if(this.params.centers_ids.length <= 0) {
            this.loading = false;
            return;
        }

        try {

            let holidays:any = await this.api.collect(
                "calendar\\Holiday",
                [
                    [ [ "date_from", ">=",  this.params.date_from], [ "date_to", "<=",  this.params.date_to ] ],
                    [ [ "date_from", ">=",  this.params.date_from], [ "date_from", "<=",  this.params.date_to ] ],
                    [ [ "date_to", ">=",  this.params.date_from], [ "date_to", "<=",  this.params.date_to ] ],
                ],
                ['name', 'date_from', 'date_to', 'type'],
                'id', 'asc', 0, 100
            );
            if(holidays) {
                for(let holiday of holidays) {
                    holiday['date_from_int']  = parseInt(holiday.date_from.substring(0, 10).replace(/-/gi, ''), 10);
                    holiday['date_to_int'] = parseInt(holiday.date_to.substring(0, 10).replace(/-/gi, ''), 10);
                }
                this.holidays = {};
                let d = new Date();
                for (let d = new Date(this.params.date_from.getTime()); d <= this.params.date_to; d.setDate(d.getDate() + 1)) {
                    let date_index = d.toISOString().substring(0, 10);
                    let date_int  = parseInt(date_index.replace(/-/gi, ''), 10);
                    this.holidays[date_index] = holidays
                        .filter( (h:any) => (date_int >= h['date_from_int'] && date_int <= h['date_to_int']) );
                }
            }
        }
        catch(response) {
            console.warn('unable to fetch holidays');
        }

        try {
            const rental_units = await this.api.collect(
                "lodging\\realestate\\RentalUnit",
                ["center_id", "in",  this.params.centers_ids],
                Object.getOwnPropertyNames(new RentalUnit()),
                'name', 'asc', 0, 500
            );
            if(rental_units) {
                this.rental_units = rental_units;
                console.log(rental_units);
            }
        }
        catch(response) {
            console.warn('unable to fetch rental units');
        }

        try {

            this.consumptions = await this.api.fetch('/?get=lodging_booking_consumptions', {
                date_from: this.params.date_from.toISOString(),
                date_to: this.params.date_to.toISOString(),
                centers_ids: JSON.stringify(this.params.centers_ids)
            });

        }
        catch(response) {
            console.warn('unable to fetch rental units');
        }

    }


    /**
     * Recompute content of the header.
     *
     * Convert to folloiwuing structure :
     *
     * headers.months:
     *    months[]
     *        {
     *            month:
     *            days:
     *        }
     *
     * headers.days: date[]
     */
    private createHeaderDays() {

        if(this.previous_duration != this.params.duration) {
            // temporarily reset cells_width to an arbitrary ow value
            this.cells_width = 12;
        }

        this.previous_duration = this.params.duration;

        // reset headers
        this.headers = {
            months: [],
            days: []
        };

        let months:any = {};
        // pass-1 assign dates
        for (let i = 0; i < this.params.duration; i++) {
            let currdate = new Date(this.params.date_from.getTime());
            currdate.setDate(currdate.getDate() + i);
            this.headers.days.push(currdate);
            let month_index = currdate.getFullYear()*100+currdate.getMonth();
            if(!months.hasOwnProperty(month_index)) {
                months[month_index] = [];
            }
            months[month_index].push(currdate);
        }

        // pass-2 assign months (in order)
        let months_array = Object.keys(months).sort( (a: any, b: any) => (a - b) );
        for(let month of months_array) {
            this.headers.months.push(
                {
                    date: months[month][0],
                    month: month,
                    days: months[month]
                }
            );
        }

    }


    public onhoverBooking(consumption:any) {
        // relay hovered consumption to navbar
        this.hovered_consumption = consumption;
    }

    public onhoverDate(day:Date) {
        let result;
        if(day) {
            let date_index:string = day.toISOString().substring(0, 10);
            if(this.holidays.hasOwnProperty(date_index) && this.holidays[date_index].length) {
                result = this.holidays[date_index];
            }
        }
        this.hovered_holidays = result;
    }

    public onSelectedBooking(event: any) {
        this.showBooking.emit(event);
    }

    public onSelectedRentalUnit(rental_unit: any) {
        this.showRentalUnit.emit(rental_unit);
    }

    public onhoverDay(rental_unit: any, day:Date) {
        this.hovered_rental_unit = rental_unit;

        if(day) {
            let date_index:string = day.toISOString().substring(0, 10);
            if(this.holidays.hasOwnProperty(date_index) && this.holidays[date_index].length) {
                this.hovered_holidays = this.holidays[date_index];
            }
        }
        else {
            this.hovered_holidays = undefined;
        }        
    }

    public onhoverRentalUnit(rental_unit: any) {
        this.hovered_rental_unit = rental_unit;
    }

}