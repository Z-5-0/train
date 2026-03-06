import { inject, Injectable, TemplateRef } from "@angular/core";
import { NzNotificationComponent, NzNotificationService } from 'ng-zorro-antd/notification';
import { debounceTime, Subject } from "rxjs";
import { MessageItem, MessagePriority, MessageTemplate, MessageTransportIcon } from "../shared/models/common";

type MessageInput = string | MessageItem[];

@Injectable({
    providedIn: 'root',
})
export class MessageService {
    private notification = inject(NzNotificationService);

    private notificationSubject$ = new Subject<[MessageTemplate, MessagePriority, MessageItem[]]>();

    private templates = new Map<MessageTemplate, TemplateRef<{ $implicit: NzNotificationComponent; data: MessageItem[] }>>();

    private errorMessageTitles: Record<MessagePriority, string> = {
        success: 'SUCCESS',
        info: 'INFO',
        warning: 'WARNING',
        error: 'ERROR',
        blank: 'MESSAGE',
    }

    constructor() {
        this.notificationSubject$.pipe(
            debounceTime(100)
        ).subscribe(([template, priority, content]: [MessageTemplate, MessagePriority, MessageItem[]]) => {
            let title = this.errorMessageTitles[priority];
            let templateRef = this.templates.get(template);

            if (!templateRef) {
                console.warn(`Message template "${template}" is not registered.`);
                priority = 'error';
                templateRef = this.templates.get('general');
                content = [{ text: 'Unable to display message.', icon: null }];
            }

            if (!templateRef) {
                console.error('Fallback template "general" is also missing!');
                return;
            }

            this.notification.create(
                priority,
                '',
                templateRef,
                {
                    nzKey: 'unique-key',
                    nzClass: priority,
                    nzStyle: { whiteSpace: 'pre-wrap' },
                    nzDuration: 6000,
                    nzPlacement: 'top',
                    nzData: {
                        priority,
                        title,
                        content,
                    },
                }
            );
        });
    }

    public registerTemplate(
        templateType: MessageTemplate,
        template: TemplateRef<{ $implicit: NzNotificationComponent; data: MessageItem[] }>
    ) {
        this.templates.set(templateType, template);
    }

    public showMessage(
        template: MessageTemplate,
        priority: MessagePriority,
        data: MessageInput
    ) {
        this.notificationSubject$.next([
            template,
            priority,
            this.normalizeMessage(data)
        ]);
    }

    private normalizeMessage(message: MessageInput): MessageItem[] {
        return typeof message === 'string'
            ? [{ text: message, icon: null }]
            : message;
    }

    public showSuccess(message: MessageInput): void {
        this.showMessage('general', 'success', message);
    }

    public showInfo(message: MessageInput): void {
        this.showMessage('general', 'info', message);
    }

    public showWarning(message: MessageInput): void {
        this.showMessage('general', 'warning', message);
    }

    public showError(message: MessageInput): void {
        this.showMessage('general', 'error', message);
    }

    public showBlank(message: MessageInput): void {
        this.showMessage('general', 'blank', message);
    }
}