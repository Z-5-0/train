import { inject, Injectable } from "@angular/core";
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { debounceTime, Subject } from "rxjs";

type MessageType = 'success' | 'info' | 'warning' | 'error';

@Injectable({
    providedIn: 'root',
})
export class MessageService {
    private notificationSubject$ = new Subject<[MessageType, string]>();
    private notification = inject(NzNotificationService);

    constructor() {
        this.notificationSubject$.pipe(
            debounceTime(100)
        ).subscribe(([type, msg]) => {
            this.notification.create(
                type,
                type,
                msg,
                {
                    nzKey: 'unique-key',
                    nzClass: type,
                    nzStyle: { whiteSpace: 'pre-wrap' },
                    nzDuration: 6000,
                    nzPlacement: 'top'
                }
            );
        });
    }

    showSuccess(message: string): void {
        this.notificationSubject$.next(['success', message]);
    }

    showInfo(message: string): void {
        this.notificationSubject$.next(['info', message]);
    }

    showWarning(message: string): void {
        this.notificationSubject$.next(['warning', message]);
    }

    showError(message: string): void {
        this.notificationSubject$.next(['error', message]);
    }
}