import { PositionOnBoard, Piece, Move } from '../board/pieces/base-piece';
import { BoardInfo } from '../rule-set/rule-set.service';

export class BlockInfo implements PositionOnBoard {
    rowIndex: number;
    columnIndex: number;
    piece?: Piece;
    nextPossibleMoves(board: BoardInfo): Move[] {
        return this.piece ? this.piece.nextPossibleMoves(board, this) : [];
    }
    isOccupied() {
        return !!this.piece;
    }
    isOccupiedByEnemy(block: BlockInfo) {
        if (!block || !block.piece) {
            return false;
        }
        return block.piece.team !== this.piece.team;
    }
    isOccupiedByFriend(block: BlockInfo) {
        if (!block || !block.piece) {
            return false;
        }
        return block.piece.team === this.piece.team;
    }
}
