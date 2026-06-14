import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedirectAction } from './redirect-action';

describe('RedirectAction', () => {
  let component: RedirectAction;
  let fixture: ComponentFixture<RedirectAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RedirectAction],
    }).compileComponents();

    fixture = TestBed.createComponent(RedirectAction);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
