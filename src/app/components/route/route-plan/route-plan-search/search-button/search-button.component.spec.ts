import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchButtonComponentComponent } from './search-button.component';

describe('SearchButtonComponentComponent', () => {
  let component: SearchButtonComponentComponent;
  let fixture: ComponentFixture<SearchButtonComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchButtonComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchButtonComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
