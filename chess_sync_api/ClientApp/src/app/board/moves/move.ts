import { BoardInfo } from 'src/app/rule-set/board-info';
import { Piece } from '../pieces/base-piece';
import { PositionOnBoard } from "../../block-info/position-on-board";
export class Move {
    constructor(public from: PositionOnBoard, public to: PositionOnBoard, public canPromote: boolean = false) {
    }
    moved = false;
    promotion(board: BoardInfo, piece: Piece) {
        const to = board.get(this.to);
        if (this.canPromote && this.moved && board.lastMove === this) {
            to.piece = piece;
        }
    }
    effect(board: BoardInfo): Piece {
        const to = board.get(this.to);
        const from = board.get(this.from);
        if (!from.isOccupiedByFriend(to)) {
            const pieceBeingKilled = to.piece;
            const pieceBeingMoved = from.piece;
            to.piece = pieceBeingMoved;
            pieceBeingMoved.block = to;
            from.piece = undefined;
            if (pieceBeingKilled) {
                pieceBeingKilled.block = undefined;
                const index = board.pieces.indexOf(pieceBeingKilled);
                board.pieces.splice(index, 1);
            }
            board.lastMove = pieceBeingMoved.lastMove = this;
            if (pieceBeingMoved.type === 'king') {
                board.updateKingsPosition();
            }
            this.moved = true;
            return pieceBeingKilled;
        }
    }
    clone() {
        return new Move(this.from, this.to, this.canPromote);
    }
}
