import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EnvService} from '../../services/env.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
    @Output() toggleMenu = new EventEmitter();
    @Output() toggleBar = new EventEmitter();
    @Input() section: string;
    @Input() items: any[];
    @Input() action: string;
    @Input() i18n: any;
    @Input() fragment: string = '';
    @Output() select = new EventEmitter<any>();
    @Output() onAction = new EventEmitter<any>();

    public user: any = {};
    public date: Date = new Date();

    public ready: boolean = false;

    public app_logo_url: string = '';

    constructor(
        private router: Router,
        private auth: AuthService,
        private env:EnvService
    ) { }

    ngOnInit(): void {
        this.auth.getObservable().subscribe((user: any) => {
            this.user = user;
            this.ready = true;
        });

        this.env.getEnv().then( (environment:any) => {
            this.app_logo_url = (environment.app_logo_url)?environment.app_logo_url:'';
        });
    }

    public calcUserBackground():string {
        const colors = ['#21b5b8', '#ea4e61', '#f7ab2a', '#83bb32'];
        let i = 0;
        if(this.user && this.user.hasOwnProperty('id')) {
            i = this.user.id % 4;
        }
        return colors[i];
    }

    public calcUserInitials():string {

        let res: string = '';
        if(this.user && typeof(this.user) == 'object' && this.user != null) {
            if(this.user.hasOwnProperty('identity_id') && this.user.identity_id && typeof this.user.identity_id == 'object') {
                const firstname = this.user.identity_id.firstname;
                const lastname = this.user.identity_id.lastname;
                if (typeof firstname === 'string' && firstname.length > 0) {
                    res = firstname.charAt(0);
                }
                if (typeof lastname === 'string' && lastname.length > 0) {
                    res += lastname.charAt(0);
                }
            }

            if(res.length == 0) {
                if(this.user.hasOwnProperty('name') && typeof this.user.name === 'string' && this.user.name.length > 0) {
                    const parts = this.user.name.split(' ').filter((p: string) => p.length > 0);
                    if(parts.length > 0) {
                        res = parts[0].charAt(0);
                        if(parts.length > 1) {
                            res += parts[1].charAt(0);
                        }
                    }
                }
            }

            if(res.length == 0) {
                if(this.user.hasOwnProperty('login')) {
                    res = this.user.login.charAt(0);
                }
            }

        }
        return res;
    }

    public toggleSideMenu() {
        this.toggleMenu.emit();
    }

    public toggleSideBar() {
        this.toggleBar.emit();
    }

    public doAction() {
        this.onAction.emit();
    }

    public onMouseDownItem(event: MouseEvent, item: any): void {
        if((event.ctrlKey || event.metaKey) && item.hasOwnProperty('route') && typeof item.route === 'string') {
            const origin = window.location.origin;
            // remove trailing slashes
            const base = window.location.pathname.replace(/\/+$/, '');
            // remove starting slashes
            const route = item.route.replace(/^\/+/, '');

            const url = `${origin}${base}/#/${route}`;

            window.open(url, '_blank');
            event.preventDefault();
            event.stopPropagation();
        }
    }

    public onClickItem(event: MouseEvent, item: any) {
        console.debug('HeaderComponent::onclick', item);
        if(event.ctrlKey || event.metaKey) {
            // ctrl/cmd + click = request for opening link in new tab
            return;
        }
        this.select.emit(item);
    }
}
