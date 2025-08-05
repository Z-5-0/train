import { Directive, ElementRef, EventEmitter, inject, Input, OnDestroy, Output } from "@angular/core";
import { concat, fromEvent, interval, merge, of, Subject, Subscription, timer } from "rxjs";
import { filter, map, switchMap, take, takeUntil, tap } from "rxjs/operators";

@Directive({
    selector: "[longPress]"
})
export class LongPressDirective implements OnDestroy {
    @Input() longPressDisabled: boolean = false;
    @Output() longPressed = new EventEmitter();     // TODO TYPE
    @Output() timeCollapseWhilePressing = new EventEmitter();
    private elementRef: ElementRef = inject(ElementRef);
    private destroy$: Subject<void> = new Subject<void>();
    private threshold: number = 1000;
    private isPressing: boolean = false;
    private manualPressEnd$ = new Subject<void>();

    constructor() {
        const el = this.elementRef.nativeElement;

        const pressStart$ = merge(
            fromEvent(el, 'mousedown'),
            fromEvent(el, 'touchstart')
        );

        const pressEnd$ = merge(
            fromEvent(el, 'mouseup'),
            fromEvent(el, 'mouseleave'),
            fromEvent(el, 'touchend'),
            fromEvent(el, 'touchcancel'),
            this.manualPressEnd$
        );

        pressStart$
            .pipe(
                filter(() => !this.longPressDisabled),
                tap(() => {
                    this.isPressing = false;
                }),
                switchMap(() => {
                    let intervalTime = 100;

                    const interval$ = interval(100).pipe(
                        tap(() => {
                            this.timeCollapseWhilePressing.emit(intervalTime);
                            intervalTime = intervalTime + 100;
                        }),
                        takeUntil(pressEnd$)
                    );

                    const threshold$ = timer(this.threshold).pipe(
                        tap(() => {
                            this.longPressed.emit();
                            this.manualPressEnd$.next();
                            this.isPressing = true;
                        }),
                        takeUntil(pressEnd$)
                    );

                    return merge(interval$, threshold$);
                }),
                takeUntil(this.destroy$)
            )
            .subscribe();

        fromEvent(el, 'click')
            .pipe(takeUntil(this.destroy$))
            .subscribe((event: any) => {        // TODO TYPEs
                if (this.isPressing) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    this.isPressing = false;
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}