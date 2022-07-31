import { NgModule } from '@angular/core';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { Platform } from '@angular/cdk/platform';
import { SharedLibModule, AuthInterceptorService, CustomDateAdapter } from 'sb-shared-lib';
import { SessionOrderRoutingModule } from './order-routing.module';
import { SessionOrderComponent } from './order.component';
import { SessionOrderLinesComponent } from './lines/lines.component';
import { ProductInfo, SessionOrderLinesOrderLineComponent } from './lines/_components/order-line/order-line.component';
import { SessionOrderPaymentsComponent } from './payments/payments.component';
import { SessionOrderPaymentsOrderPaymentComponent } from './payments/_components/payment/order-payment.component';
import { SessionOrderPaymentsOrderLineComponent } from './payments/_components/payment/line/order-line.component';
import { SessionOrderPaymentsPaymentPartComponent } from './payments/_components/payment/part/payment-part.component';

import { SessionOrderTicketComponent } from './ticket/ticket.component';

import { PaymentComponent } from '../_components/pos/payment/payment.component';
import { SessionOrderLinesDiscountPaneComponent } from '../_components/pos/discount/discount-pane.component';



import { OrderItemsComponent } from './lines/_components/order-items/order-items.component';

import { AppSharedModule } from '../../../shared.module';

@NgModule({
  imports: [
    SharedLibModule,    
    SessionOrderRoutingModule,
    AppSharedModule
  ],
  declarations: [
    SessionOrderComponent,
    SessionOrderLinesComponent,
    SessionOrderPaymentsComponent,
    SessionOrderPaymentsOrderPaymentComponent,
    SessionOrderLinesOrderLineComponent,
    SessionOrderPaymentsOrderLineComponent,
    SessionOrderPaymentsPaymentPartComponent,
    
    ProductInfo,
    
    PaymentComponent,
    SessionOrderLinesDiscountPaneComponent,

    SessionOrderTicketComponent,
    OrderItemsComponent
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE, Platform] },
  ]
})
export class AppInSessionOrderModule { }
