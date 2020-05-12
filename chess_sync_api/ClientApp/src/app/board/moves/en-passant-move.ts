import { BoardInfo } from 'src/app/rule-set/board-info';
import { Move } from './move';
import { Piece } from '../pieces/base-piece';
import { PositionOnBoard } from '../../block-info/position-on-board';
export class EnPassantMove extends Move {
  constructor(from: PositionOnBoard, to: PositionOnBoard, public killFrom: PositionOnBoard, canPromote: boolean = false) {
    super(from, to, canPromote);
  }
  effect(board: BoardInfo): Piece {
    super.effect(board);
    const killFrom = board.get(this.killFrom);
    const killed = killFrom.piece;
    killFrom.piece = undefined;
    return killed;
  }
  clone() {
    return new EnPassantMove(this.from, this.to, this.killFrom, this.canPromote);
  }
}
