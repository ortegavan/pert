import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pert } from './pert';

describe('Pert', () => {
  let component: Pert;
  let fixture: ComponentFixture<Pert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pert]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pert);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
