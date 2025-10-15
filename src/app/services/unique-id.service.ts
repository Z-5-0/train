import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class UniqueIdService {
    private counter = 0;

    getUniqueId(prefix: string = 'id'): string {
        this.counter++;
        return `${prefix}-${this.counter}`;
    }
}