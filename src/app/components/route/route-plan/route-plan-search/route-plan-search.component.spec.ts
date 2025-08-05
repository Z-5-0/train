import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutePlanSearchComponent } from './route-plan-search.component';

describe('RoutePlanSearchComponent', () => {
  let component: RoutePlanSearchComponent;
  let fixture: ComponentFixture<RoutePlanSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutePlanSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutePlanSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
