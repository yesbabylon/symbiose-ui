import { NgModule } from '@angular/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { Platform } from '@angular/cdk/platform';


import { SharedLibModule, AuthInterceptorService, DateAdapter } from 'sb-shared-lib';

import { SessionsComponent } from './sessions.component';


@NgModule({
  imports: [
    SharedLibModule
  ],
  declarations: [
    SessionsComponent
  ],
  providers: [
    { provide: DateAdapter, useClass: DateAdapter, deps: [MAT_DATE_LOCALE, Platform] }
  ]
})
export class AppInSessionsModule { }
