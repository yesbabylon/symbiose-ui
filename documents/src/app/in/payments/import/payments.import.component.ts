import { Component, AfterContentInit, OnInit, NgZone, Inject, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ApiService, ContextService } from 'sb-shared-lib';
import { MatSnackBar } from '@angular/material/snack-bar';


interface SalePaymentsImportDialogConfirmData {
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
  selector: 'payments-import',
  templateUrl: './payments.import.component.html',
  styleUrls: ['./payments.import.component.scss']
})
export class PaymentsImportComponent implements OnInit, AfterContentInit {

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
    const dialogRef = this.dialog.open(PaymentsImportDialogConfirm, {
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

    // #todo - accept multiple files
    const file:File = event.target.files[0];

    if(file) {

      const data:any = await this.readFile(file);

      try {

        const response:any = await this.api.call('?do=lodging_payments_import', {
            name: file.name,
            type: file.type,
            data: data
        });
// #todo 
        // response holds the created bank statements (to fetch and display to the user)
        // reload
/*        
        const booking = await this.load( Object.getOwnPropertyNames(new Booking()) );  
        this.booking = new Booking(
          booking.id,
          booking.name,
          booking.composition_id
        );
*/


/*


si la statement_line dispose d'un structured_message 

	rechercher parmi les booking_funding non (totalement) payés (is_paid = false)
	avec payment_reference == structured_message 

	=> statement_line_id, booking_funding_id


(
	si funding.due_amount == statement_line.amount

	sinon
		si funding.due_amount < statement_line.amount
			créer deux payments (un devra être remboursé)

		si funding.due_amount > statement_line.amount		
			créer un payment (funding pas encore marqué comme payé)
)

sinon

	rechercher parmi les booking_funding non (totalement) payés (is_paid = false)
	pour un centre donné (center_id == center_id correspondant au code IBAN du statement de la statement_line)

	pour chaque funding candidat, lire l'iban du partner (customer_id) associé
	si customer_id.partner_identity_id.bank_account_iban == statement_line.account_iban

	si funding.due_amount == statement_line.amount

	=> statement_line_id, booking_funding_id

	(sinon on n'est pas certain de la raison du paiement)


*/
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
export class PaymentsImportDialogConfirm {
  constructor(
    public dialogRef: MatDialogRef<PaymentsImportDialogConfirm>,
    @Inject(MAT_DIALOG_DATA) public data: SalePaymentsImportDialogConfirmData
  ) {}
}  
