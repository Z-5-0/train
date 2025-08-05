import { ElementRef, Injectable } from '@angular/core';
import { NzScrollService } from 'ng-zorro-antd/core/services';

@Injectable({
    providedIn: 'root',
})
export class ScrollToTopService {
    constructor(private nzScrollService: NzScrollService) { }

    scrollToTopOfElement(el: ElementRef<HTMLElement>, duration: number = 500): void {
        if (el) {
            this.nzScrollService.scrollTo(el.nativeElement, 0, { duration });
        } else {
            console.warn(`Template reference variable '${el}' not found.`);
        }
    }
}