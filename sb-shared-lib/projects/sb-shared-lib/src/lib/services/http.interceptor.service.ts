import { Injectable } from '@angular/core';
import { Observable, from } from "rxjs";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpHeaders } from '@angular/common/http';


@Injectable({
    providedIn: 'root'
})
export class AuthInterceptorService implements HttpInterceptor {

    private storage: any;

    constructor() {
        this.storage = localStorage;
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return this.handleAccess(request, next);
    }

    private getAccessToken() {
        return this.storage.getItem('access_token');
    }

    private handleAccess(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const method = req.method.toUpperCase();
        const isMutation = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';


        let headers: Record<string, string> = {};

        if(isMutation) {
            const csrf = localStorage.getItem('csrf_token');
            if(csrf) {
                headers['X-CSRF-Token'] = csrf;
            }
        }

        const csrf_nonce = window.localStorage.getItem('csrf_nonce');
        if(csrf_nonce) {
            headers['X-Nonce'] = csrf_nonce;
        }

        // #memo - we use httpOnly cookie
        // const token = this.getAccessToken();
        // headers['Authorization'] = `Bearer ${token}`;

        // #memo - For Mobile: we're using HTTP from webview, origin is set to http://localhost (android) or capacitor://localhost (iOS)
        // To allow that origin, add a custom X-App-ID header to emit CORS response allowing any request having this header set to an authorized value.

        const cloned = req.clone({
            setHeaders: headers,
            // required when using httpOnly cookie for Auth
            withCredentials: true
        });

        return next.handle(cloned);
    }
}
