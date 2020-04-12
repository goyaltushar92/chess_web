import { BoardInfo, RuleSet } from 'src/app/rule-set/rule-set.service';
import { BlockInfo } from 'src/app/block-info/block-info';

export type PieceType = 'pyada' | 'elephant' | 'horse' | 'camel' | 'king' | 'queen';
export type Teams = 'black' | 'white';

export interface PositionOnBoard {
    rowIndex: number;
    columnIndex: number;
}
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
            from.piece = undefined;
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

export abstract class Piece {
    lastMove: Move;
    constructor(public ruleSet: RuleSet, public team: Teams) {
    }
    abstract get type(): PieceType;
    abstract nextPossibleMoves(boardInfo: BoardInfo, blockInfo: BlockInfo): Move[];
    clone() {
        const constructor = Object.getPrototypeOf(this).constructor;
        const piece = new constructor(this.ruleSet, this.team);
        piece.lastMove = this.lastMove;
        return piece as Piece;
    }
}
