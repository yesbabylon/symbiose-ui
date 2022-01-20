import { Component, AfterContentInit, OnInit, NgZone, Inject, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ApiService, ContextService } from 'sb-shared-lib';
import { MatSnackBar } from '@angular/material/snack-bar';


interface BookingCompositionDialogConfirmData {
  booking: Booking;
  relationship: string;
}

class Booking {
  constructor(
    public id: number = 0,
    public name: string = '',
    public composition_id: number = 0
  ) {}
}


@Component({
  selector: 'booking-composition',
  templateUrl: './booking.composition.component.html',
  styleUrls: ['./booking.composition.component.scss']
})
export class BookingCompositionComponent implements OnInit, AfterContentInit {

  @ViewChild('fileUpload') file_upload: ElementRef;
  
  public showSbContainer: boolean = false;
  public selectedTabIndex:number = 0;
  public loading = true;

  public booking_id: number;
  public booking: any = new Booking();

  constructor(
    private dialog: MatDialog,
    private api: ApiService, 
    private route: ActivatedRoute,
    private context:ContextService,
    private snack: MatSnackBar,
    private zone: NgZone) {
    
  }

  /**
   * Set up callbacks when component DOM is ready.
   */
  public ngAfterContentInit() {
    this.loading = false;

    // _open and _close event are relayed by eqListener on the DOM node given as target when a context is requested
    // #sb-booking-container is defined in booking.edit.component.html
    $('#sb-composition-container').on('_close', (event, data) => {
      this.zone.run( () => {
        this.showSbContainer = false;
        this.selectedTabIndex = 0;
      });
    });

    $('#sb-composition-container').on('_open', (event, data) => {
      this.zone.run( () => {
        this.showSbContainer = true;
      });
    });
  }

  ngOnInit() {
    // fetch the booking ID from the route
    this.route.params.subscribe( async (params) => {
      if(params && params.hasOwnProperty('id')) {
        try {
          this.booking_id = <number> params['id'];
          const booking = await this.load( Object.getOwnPropertyNames(new Booking()) );  
          this.booking = new Booking(
            booking.id,
            booking.name,
            booking.composition_id
          );
        }
        catch(error) {
          console.warn(error);
        }
      }
    });
  }

  private async load(fields: any[]) {
    const result = await this.api.read("lodging\\sale\\booking\\Booking", [this.booking_id], fields);
    if(result && result.length) {
      return result[0];
    }
    return {};
  }

  /**
   * Request a new eQ context for selecting a payer, and relay change to self::payerChange(), if an object was created
   * #sb-booking-container is defined in booking.edit.component.html
   */
  public viewFullList() {
    // 
    this.selectedTabIndex = 1;

    let descriptor = {
      context: {
        entity:     'sale\\booking\\CompositionItem',
        type:       'list',
        name:       'default',
        domain:     ['composition_id', '=', this.booking.composition_id],
        mode:       'view',
        purpose:    'view',
        target:     '#sb-composition-container',
        callback:   (data:any) => {
          if(data && data.objects && data.objects.length) {
            // received data
          }
        }
      }
    };

    // will trigger #sb-composition-container.on('_open')
    this.context.change(descriptor);
  }
  
  public onGenerate() {
    const dialogRef = this.dialog.open(BookingCompositionDialogConfirm, {
      width: '50vw',
      data: {booking: this.booking}
    });

    dialogRef.afterClosed().subscribe( async (result) => {
      if(result) {
        const data:any = await this.api.fetch('?do=lodging_composition_generate&booking_id='+this.booking_id);
        // reload
        const booking = await this.load( Object.getOwnPropertyNames(new Booking()) );  
        this.booking = new Booking(
          booking.id,
          booking.name,
          booking.composition_id
        );
      }
      else {
        console.log('answer is no');
      }
    });
  }


  public async onFileSelected(event:any) {
    console.log('BookingCompositionComponent::onFileSelected', event);
    const file:File = event.target.files[0];

    if(file) {

      const data:any = await this.readFile(file);

      try {

        const response:any = await this.api.call('?do=lodging_composition_import', {
            name: file.name,
            type: file.type,
            data: data,
            booking_id: this.booking_id 
        });

        // reload
        const booking = await this.load( Object.getOwnPropertyNames(new Booking()) );  
        this.booking = new Booking(
          booking.id,
          booking.name,
          booking.composition_id
        );

      }
      catch (err) {
          this.snack.open("Format non reconnu", "Erreur");
          console.log(err);
      }

    }

    // reset input 
    this.file_upload.nativeElement.value = "";
  }


  private readFile(file: any) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        let blob = new Blob([file], { type: file.type });
        reader.onload = () => {
          resolve(reader.result);
        }
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
  }

}


@Component({
  selector: 'dialog-booking-composition-generate-confirm-dialog',
  template: `
  <h1 mat-dialog-title>Générer la composition</h1>

  <div mat-dialog-content>
    <p>Cet assistant générera une composition sur base de la réservation <b>{{data.booking.name}}</b>.</p>
    <p>Les détails de la composition existante seront remplacés et les éventuels changements effectués seront perdus.</p>
    <p><b>Confirmez-vous la (re)génération ?</b></p>
  </div>

  <div mat-dialog-actions>
    <button mat-button [mat-dialog-close]="false">Annuler</button>
    <button mat-button [mat-dialog-close]="true" cdkFocusInitial>Créer</button>
  </div>
  `
})
export class BookingCompositionDialogConfirm {
  constructor(
    public dialogRef: MatDialogRef<BookingCompositionDialogConfirm>,
    @Inject(MAT_DIALOG_DATA) public data: BookingCompositionDialogConfirmData
  ) {}
}  