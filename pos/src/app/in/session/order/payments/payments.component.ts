import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChildren, QueryList } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, ContextService, TreeComponent, RootTreeComponent } from 'sb-shared-lib';
import { CashdeskSession } from './../../session.model';
import { Order, OrderPayment, OrderPaymentPart} from './payments.model';
import { SessionOrderPaymentsOrderPaymentComponent } from './components/payment/order-payment.component';


// declaration of the interface for the map associating relational Model fields with their components
interface OrderComponentsMap {
    order_payments_ids: QueryList<SessionOrderPaymentsOrderPaymentComponent>
};


@Component({
  selector: 'session-order-payments',
  templateUrl: 'payments.component.html',
  styleUrls: ['payments.component.scss']
})
export class SessionOrderPaymentsComponent extends TreeComponent<Order, OrderComponentsMap> implements RootTreeComponent, OnInit, AfterViewInit {


    @ViewChildren(SessionOrderPaymentsOrderPaymentComponent) SessionOrderPaymentsOrderPaymentComponents: QueryList<SessionOrderPaymentsOrderPaymentComponent>; 


    public products : any =  [{ id: 1, price: "5", name: "Esteban", quantity: "1.00", discount: "" }, { id: 2, price: "7.5", name: "Graccus", quantity: "1.00", discount: "" }];
    public selectedProduct = 0;
    public invoice = false;
    public actionType : any = "quantity";
    public index : number;
    public quantityTest = "";
    public priceTest = "";
    public discountTest = "";
    public numberPassed = 0;
    // public numberPassedIndex = -1;
    public total = 0;
    public taxes = 0;
    public myTimeout : any;
    public posLineDisplay : string = "main";
    public discountValue : any = "";
    public operator : string = '+';
    public paymentValue : string;




    public ready: boolean = false;

    public session: CashdeskSession = new CashdeskSession();

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private api: ApiService,
        private context: ContextService
    ) {
        super( new Order() );
    }

    public ngAfterViewInit() {
        // init local componentsMap
        let map:OrderComponentsMap = {
            order_payments_ids: this.SessionOrderPaymentsOrderPaymentComponents
        };
        this.componentsMap = map;
    }

    public ngOnInit() {
        console.log('SessionOrderPaymentsComponent init');

        // fetch the ID from the route
        this.route.params.subscribe( async (params) => {
            if(params && params.hasOwnProperty('session_id') && params.hasOwnProperty('order_id')) {
                try {
                    await this.loadSession(<number> params['session_id']);
                    await this.load(<number> params['order_id']);
                    this.ready = true;
                }
                catch(error) {
                    console.warn(error);
                }
            }
        });
    }

    private async loadSession(session_id: number) {
        if(session_id > 0) {
            try {
                const result:any = await this.api.read(CashdeskSession.entity, [session_id], Object.getOwnPropertyNames(new CashdeskSession()));
                if(result && result.length) {
                    this.session = <CashdeskSession> result[0];
                }
            }
            catch(response) {
                throw 'unable to retrieve given session';
            }
        }
    }


    /**
     * Load an Order object using the sale_pos_order_tree controller
     * @param order_id
     */
    async load(order_id: number) {
        if(order_id > 0) {
            try {
                const result:any = await this.api.fetch('/?get=sale_pos_order_tree', {id:order_id, variant: 'payments'});
                if(result) {
                    this.update(result);
                }
            }
            catch(response) {
                console.log(response);
                throw 'unable to retrieve given order';
            }
        }
    }


    /**
     * 
     * @param values 
     */
    public update(values:any) {
        super.update(values);
    }

    public onupdatePayment(line_id:any) {
        console.log('onupdatePayment');
        // a line has been updated: reload tree
        this.load(this.instance.id);
    }

    public async ondeletePayment(line_id:number) {
        // a line has been removed: reload tree
        this.load(this.instance.id);
    }

    public async onclickCreateNewPayment() {
        await this.api.create((new OrderPayment()).entity, {order_id: this.instance.id});
        this.load(this.instance.id);
    }



    onBackSpace(element: any) {
        this.checkNumberPassed(element);
      }
    
      checkActionType(event: any) {
        this.actionType = event;
        this.quantityTest = "";
        this.priceTest = "";
      }
    
      checkNumberPassed(event: any) {
        // first check what component is displayed
        if(this.posLineDisplay == "discount" || this.posLineDisplay =="payment"){
          if(event== 'backspace'){
            this.discountValue = this.discountValue.toString();
            let test = this.discountValue.slice(0, -1);
            this.discountValue = test;
          }else if (((this.discountValue.includes('.') && this.discountValue.indexOf('.')>3)  || (!this.discountValue.includes('.') && this.discountValue.length>1)) && this.posLineDisplay !="payment"){
           this.discountValue = "100"; 
          }
           else if(event!= 'backspace' && event!= ',' && event!= '+/-') {
            this.discountValue += event;
          }else if(event == ','){
            if (!this.discountValue.includes('.')) {
              this.discountValue += ".";
            } 
          }
        }else{
    
          if(event == '+' || event == "-" && this.index != undefined){
            if(this.operator =='-' && !this.products[this.index][this.actionType].includes('-')){
              // this.quantityTest = '-' + this.products[this.index][this.actionType];
              this.products[this.index][this.actionType] = '-' + this.products[this.index][this.actionType];
            }else if (this.index != undefined){
              console.log(this.index)
              let test = this.products[this.index][this.actionType].replace('-', '+');
              this.products[this.index][this.actionType] = test
            }
            return;
          }
          // else if(event == 'swap'){
          //   if(this.operator =='+'){
          //     this.operator = '-'
          //   }else{
          //     this.operator = '+';
          //   }
          // }
          else if(event != 'backspace' && event != '%'){
            this.numberPassed = event;
            // this.numberPassedIndex++;
          }else if (event == "%"){
            this.posLineDisplay = "discount";
            return;
          }
      
          
          // reset the element when time has passed if you type
          clearTimeout(this.myTimeout);
          this.myTimeout = setTimeout(() => {
            // Use of other variable to give values in two steps
            this.quantityTest = "";
            this.priceTest = "";
            this.discountTest = "";
          }, 2000);
      
      
    
          // !! Je fais déjà un check pour number quel intérêt pour backspace et %, t'es retard ?
          if (typeof this.numberPassed == "number") {
            if (this.actionType == "quantity") {
              if (event != 'backspace') {
                this.quantityTest += this.numberPassed.toString();
                this.products[this.index].quantity = this.quantityTest;
              } else {
                  if(this.products[this.index].quantity !=""){
                    this.quantityTest = this.quantityTest.slice(0, -1);
                    this.products[this.index].quantity = this.quantityTest;
                  }else{
                    this.products.splice(this.index, 1);
                  } 
              }
            } else if (this.actionType == "price") {
              if (event != 'backspace') {
                this.priceTest += this.numberPassed.toString()
                this.products[this.index].price = this.priceTest;
              } else {
                if (this.products[this.index].price !=""){
                this.priceTest = this.priceTest.slice(0, -1);
                this.products[this.index].price = this.priceTest;
                }else{
                  this.products.splice(this.index, 1);
                }
              }
            } 
            // Ex discount condition
    
            // else if (this.actionType == "discount") {
            //   if (this.discountTest.length > 1) {
            //     this.discountTest = "100";
            //     this.products[this.index].discount = this.discountTest;
            //   } else if (event != 'backspace' && event != '%') {
            //     this.discountTest += this.numberPassed.toString();
            //     this.products[this.index].discount = this.discountTest;
        
            //   } else {
            //     if(this.products[this.index].discount !=""){
            //     this.discountTest = this.discountTest.slice(0, -1);
            //     this.products[this.index].discount = this.discountTest;
            //     }else{
            //       this.products.splice(this.index, 1);
            //     }
            //   }
            // }
          } 
          // Checks for commas and adapts reaction
          else if (this.numberPassed == ",") {
            if (this.actionType == "quantity" && !this.quantityTest.includes('.')) {
              this.quantityTest += ".";
              this.products[this.index].quantity = this.quantityTest;
            } else if (this.actionType == "price" && !this.quantityTest.includes('.')) {
              this.priceTest += ".";
              this.products[this.index].price = this.priceTest;
            } 
            // else if (this.actionType == "discount") {
            //   this.discountTest += ".";
            //   this.products[this.index].discount = this.discountTest;
            // }
          }
    
          //calcule du total
          this.total = 0;
          this.products.forEach((element: any) => {
            this.total += Number(element.price) * Number(element.quantity);
          })
        }
    
    
        
      }

}