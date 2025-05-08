import { NgModule } from '@angular/core';
import { SharedLibComponent } from './shared-lib.component';
import { EnvService } from './services/env.service';
import { MenuListItemComponent } from './components/menu-list-item/menu-list-item.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { AppSideBarComponent } from './components/sidebar/sidebar.component';
import { AppSideMenuComponent } from './components/sidemenu/sidemenu.component';
import { LoaderComponent } from './components/loader/loader.component';
import { DateSelectionComponent } from './components/date-selection/date-selection.component';

import { SbMany2OneSelectComponent } from './components/sb-m2o-select/sb-m2o-select.component';
import { SbDialogConfirmDialog, SbDialogConfirmModel } from './components/sb-dialog-confirm/sb-dialog-confirm.dialog';
import { SbDialogNotifyDialog, SbDialogNotifyModel } from './components/sb-dialog-notify/sb-dialog-notify.dialog';


import { EqDateRangeComponent } from './components/eq-date-range/eq-date-range.component';
import { EqDateTimeComponent } from './components/eq-date-time/eq-date-time.component';
import { EqDateComponent } from './components/eq-date/eq-date.component';
import { EqDialogConfirm } from './components/eq-dialog-confirm/eq-dialog-confirm';
import { EqDialogNotify } from './components/eq-dialog-notify/eq-dialog-notify';
import { EqM2oComponent } from './components/eq-m2o/eq-m2o.component';
import { EqStringComponent } from './components/eq-string/eq-string.component';
import { EqTextComponent } from './components/eq-text/eq-text.component';

import { VarDirective } from './directives/var.directive';
import { ClickOutDirective } from './directives/clickOut.directive';


import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';


import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from  '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from  '@angular/material/button';
import { MatSidenavModule } from  '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from  '@angular/material/icon';
import { MatToolbarModule } from  '@angular/material/toolbar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatRadioModule } from '@angular/material/radio';
import { MatTreeModule } from '@angular/material/tree';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatPaginatorModule } from '@angular/material/paginator';


import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { QuillModule } from 'ngx-quill'
import { MarkdownModule } from 'ngx-markdown';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

const materialModules = [
    MatDatepickerModule, MatNativeDateModule, MatRippleModule, MatCardModule, MatDividerModule, MatListModule, MatButtonModule, MatSidenavModule,  MatIconModule, MatToolbarModule,
    MatChipsModule, MatExpansionModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatProgressBarModule, MatCheckboxModule, MatAutocompleteModule, MatMenuModule, MatBadgeModule, MatStepperModule, MatGridListModule, MatRadioModule, MatTreeModule, MatSlideToggleModule,
    MatButtonToggleModule, MatPaginatorModule, MatDialogModule,
    DragDropModule, TextFieldModule,
    NgxMaterialTimepickerModule
 ];

const angularModules = [
    CommonModule, HttpClientModule, FormsModule, ReactiveFormsModule, TranslateModule
];

const sharedComponents = [
    SharedLibComponent, LoaderComponent, HeaderComponent, FooterComponent, AppSideBarComponent, AppSideMenuComponent,
    DateSelectionComponent,
    // @deprecated (use Eq components instead)
    SbMany2OneSelectComponent, SbDialogConfirmDialog, SbDialogNotifyDialog,
    EqDateRangeComponent, EqDateTimeComponent, EqDateComponent, EqDialogConfirm, EqDialogNotify, EqM2oComponent, EqStringComponent, EqTextComponent,
    MenuListItemComponent,
    VarDirective, ClickOutDirective
];

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}

@NgModule({
    declarations: [...sharedComponents],
    imports: [
        ...angularModules,
        ...materialModules,
        QuillModule.forRoot({
            modules: {
                syntax: false,
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote'],
            //          [{ 'header': [1, 2, 3, 4, 5, 6, false]}],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ "align": '' }, { "align": 'center' }, { 'align': 'right' }],
                    [{ 'size': ['small', false, 'large', 'huge'] }]
                ]
            }
        }),
        MarkdownModule.forRoot(),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
            isolate: false
        })
    ],
    exports: [...sharedComponents, ...angularModules, ...materialModules, QuillModule]
})
export class SharedLibModule {
    // #todo - this list should match the available locales
    constructor(private translate: TranslateService, private env:EnvService) {
        // translate.addLangs(["en", "fr", "nl"]);
        translate.addLangs(["en", "fr"]);
        (async () => {
            const environment = await env.getEnv();
            translate.setDefaultLang(environment.lang);
        })();
    }

}