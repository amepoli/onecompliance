import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { ToastService } from './toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from '../views/backend/backend.service';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { AuthService } from '../login-page/auth.service';
import { DialogService } from './dialog.service';
import { MatDialog } from '@angular/material';
import { ImportDialogComponent } from '../dialogs/import.dialog/import.dialog.component';


export interface NavigationParams {
    defaultBehavior: "showAll" | "hideAll";
    addElement?: "show" | "hide";
    deleteElement?: "show" | "hide";
    saveElement?: "show" | "hide";
    shareElement?: "show" | "hide";
    attachments?: "show" | "hide";
    navigateRecords?: "show" | "hide"
};

@Injectable({
    providedIn: 'root'
})
export class NavigationService {

    // local data
    private _currentData: NavigationParams = {
        defaultBehavior: "showAll"
    };

    // get current data
    public getCurrentData() {
        return this._currentData;
    }

    // Event Emitter for navigation params
    public onNavigationParamsChanged: EventEmitter<NavigationParams> = new EventEmitter();

    /**
     * Constructor
     *
     */
    constructor() {
    }

    /**
     * Update Navigation Parameters
     * @param navigationParams Navigation Parameters
     */
    updateNavigationParams(navigationParams: NavigationParams) {
        this._currentData = navigationParams;
        this.onNavigationParamsChanged.next(this._currentData);
    }

}

