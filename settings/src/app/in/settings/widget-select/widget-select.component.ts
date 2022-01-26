import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-widget-select',
  templateUrl: './widget-select.component.html',
  styleUrls: ['./widget-select.component.scss']
})
export class WidgetSelectComponent implements OnInit {

  constructor() { }
  @Input() title:string;
  @Input() label: string;
  public options:any;
  ngOnInit(): void {
    this.title = this.title.replace(/[,_.]/g, ' ');
  }
  public consoler(){
    console.log('ok');
  }
}
