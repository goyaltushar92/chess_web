import { Piece } from '../board/pieces/base-piece';
import { PositionOnBoard } from "./position-on-board";
import { Move } from "../board/moves/move";
import { BoardInfo } from "../rule-set/board-info";

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
    clone() {
        const newBlock = new BlockInfo();
        newBlock.rowIndex = this.rowIndex;
        newBlock.columnIndex = this.columnIndex;
        if (this.piece) {
            newBlock.piece = this.piece.clone(newBlock);
        }
        return newBlock;
    }
}
