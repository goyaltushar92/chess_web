import { Component, OnInit, Input, HostBinding, OnChanges, SimpleChanges } from '@angular/core';
import { BlockInfo } from 'src/app/block-info/block-info';

@Component({
  selector: 'app-block',
  templateUrl: './block.component.html',
  styleUrls: ['./block.component.scss'],
  inputs: ['rowIndex', 'columnIndex', 'piece']
})
export class BlockComponent extends BlockInfo implements OnInit, OnChanges {
  constructor() {
    super();
  }
  @HostBinding('attr.team')
  get team() {
    return this.piece && this.piece.team;
  }
  @HostBinding('attr.piece')
  get attrPiece() {
    return this.piece && this.piece.type;
  }
  @HostBinding('class.piece')
  get isPiece() {
    return !!this.piece;
  }
  ngOnChanges(changes: SimpleChanges): void {
  }
  ngOnInit(): void {
  }

}
