import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SettingService } from 'src/app/settingService';

@Component({
  selector: 'app-widget-form',
  templateUrl: './widget-form.component.html',
  styleUrls: ['./widget-form.component.scss']
})
export class WidgetFormComponent implements OnInit {
  @Input() setting: any;

  public settingValue: any;

  public formControl = new FormControl();

  public showResetButton = false;
  public showSubmitButton = false;

  public focusState: any;

  constructor(public save: SettingService) { }

  ngOnInit(): void {
    this.settingValue = this.setting.setting_values_ids[0].value;
    // preset the value of formControl
    this.formControl.setValue(this.settingValue);
  }

  /**
   *  Clear the input field.
   *
   */
  public onReset(event:any) {
    console.log('WidgetFormComponent::onReset');
    // #memo - we use 'mousedown' instead of 'click' to prevent input from losing the focus
    event.stopPropagation();
    event.preventDefault();
    this.formControl.reset();
    // hide buttons
    this.showResetButton = false;
    this.showSubmitButton = false;
  }

  /**
   * Input has been modified : show submit button.
   */
  public onChange() {
    console.log('WidgetFormComponent::onChange');    
    this.showSubmitButton = true;
    this.showResetButton = true;    
  }

  public onFocus(){
    console.log('WidgetFormComponent::onFocus');
    this.showResetButton = true;
  }

  public onBlur(){
    console.log('WidgetFormComponent::onBlur');
    // hide buttons
    this.showResetButton = false;
    this.showSubmitButton = false;
    // reset input formControl
    this.formControl.setValue(this.settingValue);
  }

  public onSubmit(event:any) {
    console.log('WidgetFormComponent::onSubmit');
    // #memo - we use 'mousedown' instead of 'click' to prevent input from losing the focus
    event.stopPropagation();
    event.preventDefault();

    let newValue = this.formControl.value;
    let oldValue = this.settingValue;

    if (newValue != oldValue) {
      this.settingValue = newValue;
      this.save.toQueue(this.setting.id, { newValue: newValue, oldValue: oldValue }).subscribe( (action) => {
        if (action == 'undo') {
          this.formControl.setValue(oldValue);
          this.settingValue = oldValue;
        }
      });
    }
  }
}
