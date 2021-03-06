import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockDirective } from './block.component';

describe('BlockComponent', () => {
  let component: BlockDirective;
  let fixture: ComponentFixture<BlockDirective>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BlockDirective]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlockDirective);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
