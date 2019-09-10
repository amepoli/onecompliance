import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable()
export class FileManagerService // implements Resolve<any>
{

    files = [
        {
            'name'     : 'Work Documents',
            'type'     : 'folder',
            'owner'    : 'me',
            'size'     : '',
            'modified' : 'July 8, 2017',
            'opened'   : 'July 8, 2017',
            'created'  : 'July 8, 2017',
            'extention': '',
            'location' : 'My Files > Documents',
            'offline'  : true
        },
        {
            'name'     : 'Public Documents',
            'type'     : 'folder',
            'owner'    : 'public',
            'size'     : '',
            'modified' : 'July 8, 2017',
            'opened'   : 'July 8, 2017',
            'created'  : 'July 8, 2017',
            'extention': '',
            'location' : 'My Files > Documents',
            'offline'  : true
        },
        {
            'name'     : 'Private Documents',
            'type'     : 'folder',
            'owner'    : 'me',
            'size'     : '',
            'modified' : 'July 8, 2017',
            'opened'   : 'July 8, 2017',
            'created'  : 'July 8, 2017',
            'extention': '',
            'location' : 'My Files > Documents',
            'offline'  : true
        },
        {
            'name'     : 'Ongoing projects',
            'type'     : 'document',
            'owner'    : 'Emily Bennett',
            'size'     : '1.2 Mb',
            'modified' : 'July 8, 2017',
            'opened'   : 'July 8, 2017',
            'created'  : 'July 8, 2017',
            'extention': '',
            'location' : 'My Files > Documents',
            'offline'  : true,
            'preview'  : 'assets/images/etc/sample-file-preview.jpg'
        },
        {
            'name'     : 'Shopping list',
            'type'     : 'document',
            'owner'    : 'Emily Bennett',
            'size'     : '980 Kb',
            'modified' : 'July 8, 2017',
            'opened'   : 'July 8, 2017',
            'created'  : 'July 8, 2017',
            'extention': '',
            'location' : 'My Files > Documents',
            'offline'  : true,
            'preview'  : 'assets/images/etc/sample-file-preview.jpg'
        },
        {
            'name'     : 'Invoices',
            'type'     : 'spreadsheet',
            'owner'    : 'Emily Bennett',
            'size'     : '750 Kb',
            'modified' : 'July 8, 2017',
            'opened'   : 'July 8, 2017',
            'created'  : 'July 8, 2017',
            'extention': '',
            'location' : 'My Files > Documents',
            'offline'  : true,
            'preview'  : 'assets/images/etc/sample-file-preview.jpg'
        },
        {
            'name'     : 'Crash logs',
            'type'     : 'document',
            'owner'    : 'Emily Bennett',
            'size'     : '980 Mb',
            'modified' : 'July 8, 2017',
            'opened'   : 'July 8, 2017',
            'created'  : 'July 8, 2017',
            'extention': '',
            'location' : 'My Files > Documents',
            'offline'  : true,
            'preview'  : 'assets/images/etc/sample-file-preview.jpg'
        },
        {
            'name'     : 'System logs',
            'type'     : 'document',
            'owner'    : 'Emily Bennett',
            'size'     : '52 Kb',
            'modified' : 'July 8, 2017',
            'opened'   : 'July 8, 2017',
            'created'  : 'July 8, 2017',
            'extention': '',
            'location' : 'My Files > Documents',
            'offline'  : true,
            'preview'  : 'assets/images/etc/sample-file-preview.jpg'
        },
        {
            'name'     : 'Prices',
            'type'     : 'spreadsheet',
            'owner'    : 'Emily Bennett',
            'size'     : '27 Mb',
            'modified' : 'July 8, 2017',
            'opened'   : 'July 8, 2017',
            'created'  : 'July 8, 2017',
            'extention': '',
            'location' : 'My Files > Documents',
            'offline'  : true,
            'preview'  : 'assets/images/etc/sample-file-preview.jpg'
        },
        {
            'name'     : 'Anabelle Manual',
            'type'     : 'document',
            'owner'    : 'Emily Bennett',
            'size'     : '1.1 Kb',
            'modified' : 'July 8, 2017',
            'opened'   : 'July 8, 2017',
            'created'  : 'July 8, 2017',
            'extention': '',
            'location' : 'My Files > Documents',
            'offline'  : true,
            'preview'  : 'assets/images/etc/sample-file-preview.jpg'
        },
        {
            'name'     : 'Steam summer sale budget',
            'type'     : 'spreadsheet',
            'owner'    : 'Emily Bennett',
            'size'     : '505 Kb',
            'modified' : 'July 8, 2017',
            'opened'   : 'July 8, 2017',
            'created'  : 'July 8, 2017',
            'extention': '',
            'location' : 'My Files > Documents',
            'offline'  : true,
            'preview'  : 'assets/images/etc/sample-file-preview.jpg'
        }
    ];

    onFilesChanged: BehaviorSubject<any>;
    onFileSelected: BehaviorSubject<any>;
    onFileAdd: BehaviorSubject<any>;
    onFileDownload: BehaviorSubject<any>;

    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     */
    constructor(
        private _httpClient: HttpClient
    )
    {
        // Set the defaults
        this.onFilesChanged = new BehaviorSubject({});
        this.onFileSelected = new BehaviorSubject({});
        this.onFileAdd = new BehaviorSubject({});
        this.onFileDownload = new BehaviorSubject({});
    }

    /**
     * Resolver
     *
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     *
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any
    {
        return new Promise((resolve, reject) => {

            Promise.all([
                this.getFiles()
            ]).then(
                ([files]) => {
                    resolve();
                },
                reject
            );
        });
    } */

    /**
     * Get files
     *
     * @returns {Promise<any>}
     
    getFiles(): Promise<any>
    {
        return new Promise((resolve, reject) => {
            this._httpClient.get('api/file-manager')
                .subscribe((response: any) => {
                    this.onFilesChanged.next(response);
                    this.onFileSelected.next(response[0]);
                    resolve(response);
                }, reject);
        });
    }
    */

    getFiles(): void
    {
        this.onFilesChanged.next(this.files); 
        this.onFileSelected.next(this.files[0]);
    }

    addFile(): void {
        this.onFileAdd.next(null);
    }

    download(selected: any): void {
        this.onFileDownload.next(selected);
    }
}
