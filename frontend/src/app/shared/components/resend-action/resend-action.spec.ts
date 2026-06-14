import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResendAction } from './resend-action';

describe('ResendAction', () => {
  let component: ResendAction;
  let fixture: ComponentFixture<ResendAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResendAction],
    }).compileComponents();

    fixture = TestBed.createComponent(ResendAction);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
