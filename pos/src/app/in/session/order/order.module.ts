import { NgModule } from '@angular/core';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { Platform } from '@angular/cdk/platform';


import { SharedLibModule, AuthInterceptorService, CustomDateAdapter } from 'sb-shared-lib';

import { SessionOrderRoutingModule } from './order-routing.module';

import { SessionOrderComponent } from './order.component';

import { SessionOrderLinesComponent } from './lines/lines.component';
import { SessionOrderLinesOrderLineComponent } from './lines/components/line/order-line.component';

import { SessionOrderPaymentsComponent } from './payments/payments.component';
import { SessionOrderPaymentsOrderPaymentComponent } from './payments/components/payment/order-payment.component';
import { SessionOrderPaymentsOrderLineComponent } from './payments/components/payment/line/order-line.component';
import { SessionOrderPaymentsPaymentPartComponent } from './payments/components/payment/part/payment-part.component';
import { PosComponent, PosOpening, ProductInfo } from '../components/pos/pos.component';
import { PosClosingCoins, PosClosing } from '../close/close.component';

import { AppInSessionModule } from '../session.module';
import { PadComponent } from '../components/pos/pad/pad.component';
import { TypeToggleComponent } from '../components/pos/pad/type-toggle/type-toggle.component';
import { PadArbitraryNumbersComponent } from '../components/pos/pad/pad-arbitrary-numbers/pad-arbitrary-numbers.component';
import { PaiementComponent } from '../components/pos/paiement/paiement.component';
import { DiscountComponent } from '../components/pos/discount/discount.component';
import { InfoComponent } from '../components/pos/info/info.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { PosArbitraryNumbersComponent } from '../components/pos-arbitrary-numbers/pos-arbitrary-numbers.component';
import { TicketComponent } from './payments/components/ticket/ticket.component';
import { OrderItemsComponent } from './lines/components/order-items/order-items.component';
import {MatPaginatorModule} from '@angular/material/paginator';
import { CloseComponent } from '../close/close.component';



@NgModule({
  imports: [
    SharedLibModule,
    SessionOrderRoutingModule,
    MatButtonToggleModule,
    MatButtonToggleModule,
    MatPaginatorModule
  ],
  declarations: [
    SessionOrderComponent,
    SessionOrderLinesComponent,
    SessionOrderPaymentsComponent,
    SessionOrderPaymentsOrderPaymentComponent,
    SessionOrderLinesOrderLineComponent,
    SessionOrderPaymentsOrderLineComponent,
    SessionOrderPaymentsPaymentPartComponent,
    PosComponent,
    PadComponent,
    TypeToggleComponent,
    PosOpening,
    ProductInfo,
    PosClosing,
    PadArbitraryNumbersComponent,
    PaiementComponent,
    PosClosingCoins,
    DiscountComponent,
    InfoComponent,
    PosArbitraryNumbersComponent,
    TicketComponent,
    OrderItemsComponent,
    CloseComponent
  ],
  exports: [PadComponent, PadArbitraryNumbersComponent, PosArbitraryNumbersComponent],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE, Platform] },
  ]
})
export class AppInSessionOrderModule { }
