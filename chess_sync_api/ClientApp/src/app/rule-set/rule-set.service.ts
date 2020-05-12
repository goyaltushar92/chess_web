import { BlockInfo } from '../block-info/block-info';
import { Teams, Piece } from '../board/pieces/base-piece';
import { PositionOnBoard } from "../block-info/position-on-board";
import { Move } from "../board/moves/move";
import { BoardInfo } from './board-info';

export abstract class RuleSet {
    constructor() {
    }
    /**
     * Set's initial positions of pieces
     * @param board board to init
     */
    abstract initBoard(board: BoardInfo, teamAtTop: Teams, teamAtBottom: Teams): void;
    abstract createPromptArray(team: Teams): Array<Piece>;
    blockColour(position: PositionOnBoard): Teams {
        return this.isWhiteBlock(position) ? 'white' : 'black';
    }
    isWhiteBlock(position: PositionOnBoard) {
        return (position.columnIndex + position.rowIndex) % 2 === 0;
    }
    isBlackBlock(position: PositionOnBoard) {
        return !this.isWhiteBlock(position);
    }
    createEmptyBoard(): BoardInfo {
        const board: BoardInfo = new BoardInfo();
        for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
            const row = [];
            for (let colIndex = 0; colIndex < 8; colIndex++) {
                const block = new BlockInfo();
                block.rowIndex = rowIndex;
                block.columnIndex = colIndex;
                row.push(block);
            }
            board.push(row);
        }
        board.ruleSet = this;
        return board;
    }
    createNewBoard(keepWhiteOnTopSide?: boolean): BoardInfo {
        const newBoard = this.createEmptyBoard();
        const orientation = (keepWhiteOnTopSide === undefined || keepWhiteOnTopSide === null)
            ? !!(Math.ceil(Math.random() * 100) % 2) : keepWhiteOnTopSide;
        const onTop: Teams = orientation ? 'white' : 'black';
        const onBottom: Teams = orientation ? 'black' : 'white';
        this.initBoard(newBoard, onTop, onBottom);
        newBoard.updateKingsPosition();
        return newBoard;
    }
    abstract suggestForPyada(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]): void;
    abstract suggestForElephant(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]): void;
    abstract suggestForHorse(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]): void;
    abstract suggestForCamel(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]): void;
    abstract suggestForKing(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]): void;
    abstract suggestForQueen(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]): void;
    abstract suggestCaseLinkMoves(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]): void;
}

