import { RuleSet } from 'src/app/rule-set/rule-set.service';
import { BoardInfo } from 'src/app/rule-set/board-info';
import { BlockInfo } from 'src/app/block-info/block-info';
import { Move } from '../moves/move';

export type PieceType = 'pyada' | 'elephant' | 'horse' | 'camel' | 'king' | 'queen';
export type Teams = 'black' | 'white';

export abstract class Piece {
  block: BlockInfo;
  lastMove: Move;
  abstract get weight(): number;
  constructor(public ruleSet: RuleSet, public team: Teams) {
  }
  abstract get type(): PieceType;
  abstract nextPossibleMoves(boardInfo: BoardInfo, blockInfo: BlockInfo): Move[];
  clone(block?: BlockInfo) {
    const constructor = Object.getPrototypeOf(this).constructor;
    const piece: Piece = new constructor(this.ruleSet, this.team);
    if (this.lastMove) {
      piece.lastMove = this.lastMove.clone();
    }
    piece.block = block;
    return piece;
  }
}
