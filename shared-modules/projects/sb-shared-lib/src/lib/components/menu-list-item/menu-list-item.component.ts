import {Component, HostBinding,  EventEmitter, Output, Input, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-menu-list-item',
  templateUrl: './menu-list-item.component.html',
  styleUrls: ['./menu-list-item.component.scss'],
  animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({transform: 'rotate(-90deg)'})),
      state('expanded', style({transform: 'rotate(90deg)'})),
      transition('expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ])
  ]
})
export class MenuListItemComponent implements OnInit {
  public expanded: boolean = false;
  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;
  @Input() item: any = {};
  @Input() depth: number;
  @Input() i18n: any;
  @Output() select = new EventEmitter<any>();
  @Output() toggle = new EventEmitter<any>();

  constructor() {
    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  ngOnInit() {

  }

  public onItemToggled(item: any) {
    // if item is expanded, fold siblings, if any
    if(item.expanded) {
      if(this.item.children) {
        for(let sibling of this.item.children) {
          if(item != sibling) {
            sibling.expanded = false;
            sibling.hidden = true;
          }
        }
      }
    }
    else {
      if(this.item.children) {
        for(let sibling of this.item.children) {
          sibling.hidden = false;
          if(sibling.children) {
            for(let subitem of sibling.children) {
              subitem.expanded = false;
              subitem.hidden = false;
            }
          }
        }
      }
    }
  }

  public onItemSelected(item: any) {
    if (item.type == 'entry') {
      this.select.emit(item);
    }
    else if (item.children && item.children.length) {
        item.expanded = !item.expanded;
        this.toggle.emit(item);
    }
  }

}