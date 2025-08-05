import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutePlanComponent } from './route-plan.component';

describe('RoutePlanComponent', () => {
  let component: RoutePlanComponent;
  let fixture: ComponentFixture<RoutePlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutePlanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutePlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
