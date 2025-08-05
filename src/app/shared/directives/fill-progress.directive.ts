import { Directive, ElementRef, Input, Renderer2, OnChanges, SimpleChanges, inject } from '@angular/core';

type FillDirection = 'bottom-to-top' | 'top-to-bottom' | 'left-to-right' | 'right-to-left';

@Directive({
    selector: '[fillProgress]'
})
export class FillProgressDirective implements OnChanges {
    @Input() fillPercent: number = 0;
    @Input() fillDirection: FillDirection = 'bottom-to-top';
    @Input() invertFill: boolean = false;
    @Input() disableClipPath: boolean = false;

    private el: ElementRef = inject(ElementRef);
    private renderer: Renderer2 = inject(Renderer2);

    ngOnChanges(changes: SimpleChanges): void {
        if (
            'fillPercent' in changes ||
            'fillDirection' in changes ||
            'invertFill' in changes ||
            'disableClipPath' in changes
        ) {
            this.updateFill();
        }
    }

    private updateFill() {
        const el = this.el.nativeElement as HTMLElement;
        let percent = this.fillPercent;

        if (this.disableClipPath) {
            this.renderer.removeStyle(el, 'clipPath');
            return;
        }

        if (this.invertFill) {
            percent = 100 - percent;
        }

        switch (this.fillDirection) {
            case 'bottom-to-top':
                this.renderer.setStyle(el, 'clipPath', `inset(0 0 ${100 - percent}% 0)`);
                break;
            case 'top-to-bottom':
                this.renderer.setStyle(el, 'clipPath', `inset(${percent}% 0 0 0)`);
                break;
            case 'left-to-right':
                this.renderer.setStyle(el, 'clipPath', `inset(0 ${100 - percent}% 0 0)`);
                break;
            case 'right-to-left':
                this.renderer.setStyle(el, 'clipPath', `inset(0 0 0 ${100 - percent}%)`);
                break;
            default:
                this.renderer.removeStyle(el, 'clipPath');
        }
    }
}
