import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BookingComponent } from './booking.component';
import { BookingEditComponent } from './edit/booking.edit.component';
import { BookingCompositionComponent } from './composition/booking.composition.component';
import { BookingQuoteComponent } from './quote/booking.quote.component';
import { BookingInvoiceComponent } from './invoice/booking.invoice.component';
import { BookingContractComponent } from './contract/booking.contract.component';
import { BookingFundingInvoiceComponent } from './funding/booking.funding.invoice.component';

const routes: Routes = [
    {
        path: '',
        component: BookingComponent
    },    
    {
        path: 'edit/:id',
        component: BookingEditComponent
    },
    {
        path: 'edit',
        component: BookingEditComponent
    },
    {
        path: 'composition/:id',
        component: BookingCompositionComponent
    },
    {
        path: 'quote/:id',
        component: BookingQuoteComponent
    },
    {
        path: 'contract/:id',
        component: BookingContractComponent
    },
    {
        path: 'funding/remind/:id/:funding_id',
        component: BookingQuoteComponent
    },
    {
        path: 'funding/:id/:funding_id',
        component: BookingFundingInvoiceComponent
    },
    {
        path: 'invoice/:id/:invoice_id',
        component: BookingInvoiceComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BookingRoutingModule {}
