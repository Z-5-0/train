import { Pipe, PipeTransform } from "@angular/core";
import { STOP_STATUS } from "../constants/stop-status";
import { StopStatus } from "../models/trip";

@Pipe({
    name: 'stopStatus',
    standalone: true
})

export class StopStatusPipe implements PipeTransform {
    transform(value: StopStatus | undefined, field: 'label' | 'icon' | 'color'): string {
        return STOP_STATUS[value ?? 'UNKNOWN']?.[field] ?? STOP_STATUS.UNKNOWN[field];
    }
}