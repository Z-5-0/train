import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteTransitComponent } from './route-transit.component';

describe('RouteTransitComponent', () => {
  let component: RouteTransitComponent;
  let fixture: ComponentFixture<RouteTransitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteTransitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RouteTransitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
