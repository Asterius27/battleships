import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameObserveComponent } from './game-observe.component';

describe('GameObserveComponent', () => {
  let component: GameObserveComponent;
  let fixture: ComponentFixture<GameObserveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameObserveComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameObserveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
