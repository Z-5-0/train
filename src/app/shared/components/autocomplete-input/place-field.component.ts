import { CommonModule, KeyValue } from '@angular/common';
import { Component, ElementRef, EventEmitter, inject, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Place, PlaceGroup } from '../../models/place';
import { debounceTime, filter, of, Subject, switchMap, tap, withLatestFrom } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { PlaceFieldPostButton } from '../../models/place-field-post-button';
import { TRANSPORT_MODE } from '../../constants/transport-mode';
import { AppSettingsService } from '../../../services/app-settings.service';

@Component({
  selector: 'place-field',
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzAutocompleteModule,
    NzIconModule,
    NzButtonModule,
  ],
  templateUrl: './place-field.component.html',
  styleUrl: './place-field.component.scss'
})


export class PlaceFieldComponent {
  @Input() name: string = '';
  @Input() collection: PlaceGroup | null = null;
  @Input() placeholder: string = '';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() selectedPlace: Place | null = null;
  @Input() postButton: PlaceFieldPostButton | null = null;
  @Output() inputChanged: EventEmitter<any> = new EventEmitter<any>; // TODO: TYPE
  @Output() selectionChanged: EventEmitter<any> = new EventEmitter<any>; // TODO: TYPE

  @ViewChild('input', { static: true }) inputElement!: ElementRef<HTMLInputElement>;

  public transportMode = TRANSPORT_MODE as Record<string, { name: string; icon: string }>;

  appSettingsService: AppSettingsService = inject(AppSettingsService);

  field: string = '';

  innerCollection: PlaceGroup | null = null;
  selectionSubject = new Subject<string>();

  inputValue: string = '';
  selectedValue: Place | null = null;

  waitingForResponse: boolean = false;

  constructor() {
    this.appSettingsService.appSettings$.pipe(
      switchMap(settings =>
        this.selectionSubject.pipe(
          debounceTime(settings['debounceTime']),
          tap(() => this.waitingForResponse = true)
        )
      )
    ).subscribe(value => {
      if (value.trim()) {
        this.inputChanged.emit({ value, name: this.name });
      }
      this.waitingForResponse = false;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['name']) {
      this.field = changes['name'].currentValue;
    }

    if (changes['collection']) {
      this.innerCollection = changes['collection'].currentValue;
    }

    if (changes['selectedPlace']) {
      this.selectedValue = changes['selectedPlace'].currentValue;
      this.inputValue = changes['selectedPlace'].currentValue?.name;
      this.inputElement.nativeElement.value = this.inputValue || '';
    }
  }

  onInputChange(e: any) {
    this.inputValue = e;
    this.selectedValue = null;
  }

  onSelectPlace(place: Place): void {
    this.selectedValue = place;
    this.selectionChanged.next({ name: this.name.substring(0, this.name.length - 1), field: this.field, place })
  }

  onSelectionCheck(value: string, input: any) {
    if (this.selectedValue?.name !== value) {
      this.clearData();
    }
  }

  clearInput() {
    this.clearData();
  }

  clearData() {
    this.inputValue = '';
    this.selectedValue = null;
    this.innerCollection = null;
    this.selectionChanged.next({ name: this.name.substring(0, this.name.length - 1), field: this.field, place: null })
  }
}
