import { BoardInfo } from 'src/app/rule-set/board-info';
import { Move } from './move';
import { Piece } from '../pieces/base-piece';
import { PositionOnBoard } from "../../block-info/position-on-board";
export class MoveWithSubMove extends Move {
    constructor(from: PositionOnBoard, to: PositionOnBoard, public subMove: Move, canPromote: boolean = false) {
        super(from, to, canPromote);
    }
    effect(board: BoardInfo): Piece {
        this.subMove.effect(board);
        return super.effect(board);
    }
    clone() {
        return new MoveWithSubMove(this.from, this.to, this.subMove, this.canPromote);
    }
}
