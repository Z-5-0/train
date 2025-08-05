import { Pipe, PipeTransform } from "@angular/core";
import { TransportMode } from "../models/common";
import { TRANSPORT_MODE } from "../constants/transport-mode";

@Pipe({
    name: 'transportMode',
    standalone: true
})

export class TransportModePipe implements PipeTransform {
    transform(value: TransportMode | null, field: 'name' | 'icon'): string {
        return TRANSPORT_MODE[value || 'ERROR']?.[field] ?? TRANSPORT_MODE.ERROR[field];
    }
}