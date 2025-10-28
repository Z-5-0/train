import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavouriteTogglerComponent } from './favourite-toggler.component';

describe('FavouriteToggleComponentComponent', () => {
  let component: FavouriteTogglerComponent;
  let fixture: ComponentFixture<FavouriteTogglerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavouriteTogglerComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FavouriteTogglerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
