import { BlockInfo } from '../block-info/block-info';
import { Teams, Piece } from '../board/pieces/base-piece';
import { MoveWithSubMove } from "../board/moves/move-with-sub-move";
import { EnPassantMove } from "../board/moves/en-passant-move";
import { Move } from "../board/moves/move";
import { Injectable } from '@angular/core';
import { Queen } from "../board/pieces/queen";
import { King } from "../board/pieces/king";
import { Camel } from "../board/pieces/camel";
import { Horse } from "../board/pieces/horse";
import { Elephant } from "../board/pieces/elephant";
import { Pyada } from "../board/pieces/pyada";
import { BoardInfo } from './board-info';
import { RuleSet } from './rule-set.service';
@Injectable({
    providedIn: 'root'
})
export class DefaultRuleSet extends RuleSet {
    constructor() {
        super();
    }
    createPromptArray(team: Teams): Array<Piece> {
        return [new Elephant(this, team), new Horse(this, team),
        new Camel(this, team), new Queen(this, team)];
    }
    initBoard(board: BoardInfo, teamAtTop: Teams, teamAtBottom: Teams): void {
        board.teamAtTop = teamAtTop;
        board.teamAtBottom = teamAtBottom;
        board.pieces = [];
        this.createTeam(teamAtTop, board, 'top');
        this.createTeam(teamAtBottom, board, 'bottom');
    }
    private createTeam(team: Teams, board: BoardInfo, boardSide: 'top' | 'bottom') {
        const row1 = boardSide === 'top' ? 0 : 7;
        const row2 = boardSide === 'top' ? 1 : 6;
        board[row1][0].piece = new Elephant(this, team);
        board[row1][7].piece = new Elephant(this, team);
        board[row1][1].piece = new Horse(this, team);
        board[row1][6].piece = new Horse(this, team);
        board[row1][2].piece = new Camel(this, team);
        board[row1][5].piece = new Camel(this, team);
        board[row1][4].piece = this.blockColour({ columnIndex: 4, rowIndex: row1 }) === team ? new Queen(this, team) : new King(this, team);
        board[row1][3].piece = this.blockColour({ columnIndex: 3, rowIndex: row1 }) === team ? new Queen(this, team) : new King(this, team);
        board[row2].forEach(a => a.piece = new Pyada(this, team));
        const pieces = [...[...board[row1], ...board[row2]]].map(a => {
            a.piece.block = a;
            return a.piece;
        });
        board.pieces.push(...pieces);
    }
    private addMove(allMoves: Move[], move: Move, board: BoardInfo) {
        if (!allMoves.find(a => a.from === move.from && a.to === move.to)) {
            allMoves.push(move);
        }
    }
    suggestForPyada(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]) {
        if (!blockInfo.piece) {
            return;
        }
        const yDirection = boardInfo.teamAtTop === blockInfo.piece.team ? 1 : -1;
        let rowIndex = blockInfo.rowIndex + yDirection;
        let columnIndex = blockInfo.columnIndex;
        if (boardInfo.canMoveForwardTo(rowIndex, columnIndex)) {
            this.addMove(possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex], rowIndex === 0 || rowIndex === 7), boardInfo);
            const atInitPosition = yDirection === 1 ? blockInfo.rowIndex === 1 : blockInfo.rowIndex === 6;
            if (atInitPosition) {
                rowIndex = blockInfo.rowIndex + (2 * yDirection);
                if (boardInfo.canMoveForwardTo(rowIndex, columnIndex)) {
                    this.addMove(
                        possibleMoves,
                        new Move(blockInfo, boardInfo[rowIndex][columnIndex], rowIndex === 0 || rowIndex === 7),
                        boardInfo
                    );
                }
            }
        }
        rowIndex = blockInfo.rowIndex + yDirection;
        columnIndex = blockInfo.columnIndex + 1;
        if (boardInfo.canMoveForwardAndKill(blockInfo.piece.team, rowIndex, columnIndex)) {
            this.addMove(possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex], rowIndex === 0 || rowIndex === 7), boardInfo);
        } else if (this.canEnPassantTo(boardInfo, rowIndex, columnIndex, yDirection)) {
            this.addMove(
                possibleMoves,
                new EnPassantMove(blockInfo, boardInfo[rowIndex][columnIndex], boardInfo.lastMove.to, rowIndex === 0 || rowIndex === 7),
                boardInfo
            );
        }
        columnIndex = blockInfo.columnIndex - 1;
        if (boardInfo.canMoveForwardAndKill(blockInfo.piece.team, rowIndex, columnIndex)) {
            this.addMove(possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex], rowIndex === 0 || rowIndex === 7), boardInfo);
        } else if (this.canEnPassantTo(boardInfo, rowIndex, columnIndex, yDirection)) {
            this.addMove(
                possibleMoves,
                new EnPassantMove(blockInfo, boardInfo[rowIndex][columnIndex], boardInfo.lastMove.to, rowIndex === 0 || rowIndex === 7),
                boardInfo
            );
        }
    }
    private canEnPassantTo(boardInfo: BoardInfo, rowIndex: number, columnIndex: number, yDirection: number) {
        if (boardInfo.lastMove && boardInfo.get(boardInfo.lastMove.to).piece.type === 'pyada') {
            if (Math.abs(boardInfo.lastMove.from.rowIndex - boardInfo.lastMove.to.rowIndex) === 2) {
                if (boardInfo.lastMove.to.rowIndex + yDirection === rowIndex && columnIndex === boardInfo.lastMove.to.columnIndex) {
                    return true;
                }
            }
        }
        return false;
    }
    suggestForElephant(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]) {
        if (!blockInfo.piece) {
            return;
        }
        const deltaList = [0, 1, -1];
        for (const rowMultiple of deltaList) {
            for (const columnMultiple of deltaList) {
                if (Math.abs(rowMultiple) === Math.abs(columnMultiple)) {
                    continue;
                }
                for (let delta = 1; delta < 8; delta++) {
                    const rowIndex = blockInfo.rowIndex + rowMultiple * delta;
                    const columnIndex = blockInfo.columnIndex + columnMultiple * delta;
                    if (!boardInfo.isValidPosition(rowIndex, columnIndex)) {
                        break;
                    }
                    if (!boardInfo.isOccupied(rowIndex, columnIndex)) {
                        this.addMove(possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo);
                    }
                    else {
                        if (boardInfo.isOccupiedByEnemy(rowIndex, columnIndex, blockInfo.piece.team)) {
                            this.addMove(possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo);
                        }
                        break;
                    }
                }
            }
        }
    }
    suggestForHorse(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]) {
        if (!blockInfo.piece) {
            return;
        }
        this.twoAndHalfMove(boardInfo, blockInfo, possibleMoves);
    }
    private twoAndHalfMove(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]) {
        const sideDelta = [-1, 1, -2, 2];
        for (const delta1 of sideDelta) {
            for (const delta2 of sideDelta) {
                if (Math.abs(delta1) !== Math.abs(delta2)) {
                    const rowIndex = blockInfo.rowIndex + delta1;
                    const columnIndex = blockInfo.columnIndex + delta2;
                    if (boardInfo.isValidPosition(rowIndex, columnIndex)
                        && !boardInfo.isOccupiedByFriend(rowIndex, columnIndex, blockInfo.piece.team)) {
                        this.addMove(possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo);
                    }
                }
            }
        }
    }
    suggestForCamel(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]) {
        if (!blockInfo.piece) {
            return;
        }
        const deltaList = [-1, 1];
        for (const deltaRow of deltaList) {
            for (const deltaCol of deltaList) {
                for (let multiple = 1; multiple < 8; multiple++) {
                    const rowIndex = blockInfo.rowIndex + deltaRow * multiple;
                    const columnIndex = blockInfo.columnIndex + deltaCol * multiple;
                    if (!boardInfo.isValidPosition(rowIndex, columnIndex)) {
                        break;
                    }
                    if (!boardInfo.isOccupied(rowIndex, columnIndex)) {
                        this.addMove(possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo);
                    }
                    else {
                        if (boardInfo.isOccupiedByEnemy(rowIndex, columnIndex, blockInfo.piece.team)) {
                            this.addMove(possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo);
                        }
                        break;
                    }
                }
            }
        }
    }
    suggestForKing(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]) {
        if (!blockInfo.piece) {
            return;
        }
        const deltaList = [-1, 0, 1];
        for (const deltaRow of deltaList) {
            for (const deltaCol of deltaList) {
                const rowIndex = blockInfo.rowIndex + deltaRow;
                const columnIndex = blockInfo.columnIndex + deltaCol;
                if (!boardInfo.isValidPosition(rowIndex, columnIndex)) {
                    continue;
                }
                if (!boardInfo.isOccupied(rowIndex, columnIndex)) {
                    this.addMove(possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo);
                }
                else {
                    if (boardInfo.isOccupiedByEnemy(rowIndex, columnIndex, blockInfo.piece.team)) {
                        this.addMove(possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo);
                    }
                }
            }
        }
    }
    suggestCaseLinkMoves(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]) {
        if (!blockInfo.piece.lastMove) {
            const homePositionOfElephants = [boardInfo[blockInfo.rowIndex][0], boardInfo[blockInfo.rowIndex][7]];
            for (const elephantHomeBlock of homePositionOfElephants) {
                if (elephantHomeBlock.piece && elephantHomeBlock.piece.team === blockInfo.piece.team && !elephantHomeBlock.piece.lastMove) {
                    const directionToCheck = blockInfo.columnIndex > elephantHomeBlock.columnIndex ? 1 : -1;
                    for (let columnIndex = blockInfo.columnIndex + directionToCheck; columnIndex > 0 && columnIndex < 7; columnIndex += directionToCheck) {
                        const block = boardInfo.get({ columnIndex, rowIndex: blockInfo.rowIndex });
                        if (block.isOccupied()) {
                            break;
                        }
                        if (boardInfo.isBlockUnderAttack(block, blockInfo.piece.team)) {
                            break;
                        }
                        if (columnIndex === 1 || columnIndex === 6) {
                            this.addMove(possibleMoves, new MoveWithSubMove(blockInfo, boardInfo.get({
                                columnIndex: blockInfo.columnIndex + 2 * directionToCheck,
                                rowIndex: blockInfo.rowIndex
                            }), new Move(boardInfo.get({ columnIndex: columnIndex + directionToCheck, rowIndex: blockInfo.rowIndex }), boardInfo.get({
                                columnIndex: blockInfo.columnIndex + directionToCheck,
                                rowIndex: blockInfo.rowIndex
                            }))), boardInfo);
                        }
                    }
                }
            }
        }
    }
    suggestForQueen(boardInfo: BoardInfo, blockInfo: BlockInfo, possibleMoves: Move[]) {
        if (!blockInfo.piece) {
            return;
        }
        const deltaList = [-1, 0, 1];
        for (const deltaRow of deltaList) {
            for (const deltaCol of deltaList) {
                for (let multiple = 1; multiple < 8; multiple++) {
                    const rowIndex = blockInfo.rowIndex + deltaRow * multiple;
                    const columnIndex = blockInfo.columnIndex + deltaCol * multiple;
                    if (!boardInfo.isValidPosition(rowIndex, columnIndex)) {
                        break;
                    }
                    if (!boardInfo.isOccupied(rowIndex, columnIndex)) {
                        this.addMove(possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo);
                    }
                    else {
                        if (boardInfo.isOccupiedByEnemy(rowIndex, columnIndex, blockInfo.piece.team)) {
                            this.addMove(possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo);
                        }
                        break;
                    }
                }
            }
        }
    }
}
