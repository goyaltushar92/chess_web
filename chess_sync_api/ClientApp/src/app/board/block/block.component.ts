import { Component, OnInit, Input, HostBinding, OnChanges, SimpleChanges, Directive } from '@angular/core';
import { BlockInfo } from 'src/app/block-info/block-info';

@Directive({
  // tslint:disable-next-line: directive-selector
  selector: 'app-block',
  inputs: ['rowIndex', 'columnIndex', 'piece']
})
export class BlockDirective extends BlockInfo implements OnInit, OnChanges {
  constructor() {
    super();
  }
  ngOnChanges(changes: SimpleChanges): void {
  }
  ngOnInit(): void {
  }

}
