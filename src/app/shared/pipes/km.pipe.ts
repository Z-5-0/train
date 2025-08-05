import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'km',
    standalone: true,
})
export class KmPipe implements PipeTransform {
    transform(value: any, fractionDigits = 0): string {
        const num = parseFloat(value);
        if (isNaN(num)) return '';
        return `${num.toFixed(fractionDigits)} km/h`;
    }
}