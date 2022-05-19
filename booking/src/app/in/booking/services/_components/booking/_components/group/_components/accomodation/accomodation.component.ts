import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ChangeDetectorRef, ViewChildren, QueryList, Host, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { ApiService, ContextService, TreeComponent } from 'sb-shared-lib';
import { BookingLineGroup } from '../../../../_models/booking_line_group.model';
import { BookingAccomodation } from '../../../../_models/booking_accomodation.model';
import { Booking } from '../../../../_models/booking.model';
import { Observable, ReplaySubject } from 'rxjs';
import { BookingServicesBookingGroupAccomodationAssignmentComponent } from './_components/assignment.component';

// declaration of the interface for the map associating relational Model fields with their components
interface BookingLineAccomodationComponentsMap {
    rental_unit_assignments_ids: QueryList<BookingServicesBookingGroupAccomodationAssignmentComponent>
};

interface vmModel {
    assignments: {
        total: number
    }
};


@Component({
    selector: 'booking-services-booking-group-accomodation',
    templateUrl: 'accomodation.component.html',
    styleUrls: ['accomodation.component.scss']
})
export class BookingServicesBookingGroupAccomodationComponent extends TreeComponent<BookingAccomodation, BookingLineAccomodationComponentsMap> implements OnInit, OnChanges, AfterViewInit  {
    // server-model relayed by parent
    @Input() set model(values: any) { this.update(values) }
    @Input() group: BookingLineGroup;
    @Input() booking: Booking;

    @Output() updated = new EventEmitter();
    @Output() deleted = new EventEmitter();

    @ViewChildren(BookingServicesBookingGroupAccomodationAssignmentComponent) BookingServicesBookingGroupAccomodationAssignmentComponents: QueryList<BookingServicesBookingGroupAccomodationAssignmentComponent>;


    public ready: boolean = false;

    public vm: vmModel;

    constructor(
        private cd: ChangeDetectorRef,
        private api: ApiService,
        private context: ContextService
    ) {
        super( new BookingAccomodation() );
        this.vm = {
            assignments: {
                total: 0
            }
        };

    }

    public ngOnChanges(changes: SimpleChanges) {
        if(changes.model) {


        }
    }

    public ngAfterViewInit() {
        // init local componentsMap
        let map:BookingLineAccomodationComponentsMap = {
            rental_unit_assignments_ids: this.BookingServicesBookingGroupAccomodationAssignmentComponents
        };
        this.componentsMap = map;
    }

    public ngOnInit() {
        this.ready = true;
    }

    public async update(values:any) {
        console.log('line update', values);
        super.update(values);

        // assign VM values

        this.vm.assignments.total = 0;
        for(let assignment of this.instance.rental_unit_assignments_ids) {
            // add new lines (indexes from this.lines and this._lineOutput are synced)
            this.vm.assignments.total += assignment.qty;
        }

    }




    /**
     * Add a manual discount
     */
    public async oncreateAssignment() {
        try {
            const assignment:any = await this.api.create("lodging\\sale\\booking\\BookingLineRentalUnitAssignement", {
                qty: 1,
                booking_id: this.booking.id,
                booking_line_group_id: this.group.id,
                booking_line_id: this.instance.id
            });
            this.instance.rental_unit_assignments_ids.push({id: assignment.id, qty: 1});
        }
        catch(response) {
            this.api.errorFeedback(response);
        }
    }

    public async ondeleteAssignment(assignment_id: any) {
        await this.api.update(this.instance.entity, [this.instance.id], {rental_unit_assignments_ids: [-assignment_id]});
        this.instance.rental_unit_assignments_ids.splice(this.instance.rental_unit_assignments_ids.findIndex((e:any)=>e.id == assignment_id),1);
        // do not relay to parent
    }

    public async onupdateAssignement(discount_id:any) {
        this.updated.emit();
    }

}