import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaceFieldComponent } from './place-field.component';

describe('AutocompleteInputComponent', () => {
  let component: PlaceFieldComponent;
  let fixture: ComponentFixture<PlaceFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaceFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaceFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
