import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MovesComponent } from './moves.component';
// import { BookingEditComponent } from './edit/booking.edit.component';


const routes: Routes = [
    {
        path: '',
        component: MovesComponent
    }
    /*
    ,
    {
        path: 'edit/:id',
        component: BookingEditComponent
    },
    {
        path: 'edit',
        component: BookingEditComponent
    }
    */
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MovesRoutingModule {}
