import { Injectable } from '@angular/core';

import { EnvService} from './env.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

interface AppManifest {
  name: string;
  description?: string;
  version?: string;
  url?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AppinfoService {

    constructor(
        private http: HttpClient,
        private env: EnvService
    ) {}


    public async load(package_name: string, app_name: string): Promise<AppManifest> {
        try {
            // make sure Environment has been fetched
            const environment = await this.env.getEnv();
            const appinfo_url = `appinfo/${package_name}/${app_name}`
            const data = await this.http.get<any>(environment.rest_api_url + appinfo_url).toPromise();

            // update local user object and notify subscribers
            return <AppManifest> data;
        }
        catch(response: any) {
            console.log('unexpected error: ', response);
            return <AppManifest> { name: 'Application' };
        }
    }

}
