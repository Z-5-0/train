import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavouriteToggleComponentComponent } from './favourite-toggler.component';

describe('FavouriteToggleComponentComponent', () => {
  let component: FavouriteToggleComponentComponent;
  let fixture: ComponentFixture<FavouriteToggleComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavouriteToggleComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FavouriteToggleComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
