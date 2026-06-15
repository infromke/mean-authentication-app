import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PulseLoader } from './pulse-loader';

describe('PulseLoader', () => {
  let component: PulseLoader;
  let fixture: ComponentFixture<PulseLoader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PulseLoader],
    }).compileComponents();

    fixture = TestBed.createComponent(PulseLoader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
