import { BlockInfo } from '../block-info/block-info';
import { Teams, PositionOnBoard, Move, Piece, EnPassantMove, MoveWithSubMove } from '../board/pieces/base-piece';
import { Injectable } from '@angular/core';
import { Horse, Elephant, Camel, King, Queen, Pyada } from '../board/pieces/pieces';

export class BoardInfo extends Array<Array<BlockInfo>> {
    ruleSet: RuleSet;
    teamAtTop: Teams;
    teamAtBottom: Teams;
    lastMove: Move;
    kingsPosition: BlockInfo[];
    getKingPosition(team: Teams) {
        let kingPosition = this.kingsPosition.find(a => a.piece && a.piece.team === team);
        if (!kingPosition) {
            kingPosition = this.reduce((pv, cv) => [...pv, ...cv], []).find(a => a.piece && a.piece.team === team);
            this.updateKingsPosition();
        }
        return kingPosition;
    }
    get nextMoveOfTeam(): Teams {
        if (!this.lastMove) {
            return 'white';
        }
        const to = this.get(this.lastMove.to);
        return to.piece.team === 'black' ? 'white' : 'black';
    }
    get lastMoveOfTeam(): Teams {
        if (!this.lastMove) {
            return 'black';
        }
        const to = this.get(this.lastMove.to);
        return to.piece.team;
    }
    isOccupied(rowIndex: number, columnIndex: number) {
        const row = this[rowIndex];
        if (!row) {
            return false;
        }
        const block = row[columnIndex];
        if (!block) {
            return false;
        }
        return !!block.piece;
    }
    isOccupiedByEnemy(rowIndex: number, columnIndex: number, team: Teams) {
        const row = this[rowIndex];
        if (!row) {
            return false;
        }
        const block = row[columnIndex];
        if (!block) {
            return false;
        }
        if (!block.piece) {
            return false;
        }
        return block.piece.team !== team;
    }
    isOccupiedByFriend(rowIndex: number, columnIndex: number, team: Teams) {
        const row = this[rowIndex];
        if (!row) {
            return false;
        }
        const block = row[columnIndex];
        if (!block) {
            return false;
        }
        if (!block.piece) {
            return false;
        }
        return block.piece.team === team;
    }
    isValidPosition(rowIndex: number, columnIndex: number) {
        return rowIndex > -1 && rowIndex < 8 && columnIndex > -1 && columnIndex < 8;
    }
    canMoveForwardTo(rowIndex: number, columnIndex: number) {
        if (!this.isValidPosition(rowIndex, columnIndex)) {
            return false;
        }
        if (this.isOccupied(rowIndex, columnIndex)) {
            return false;
        }
        return true;
    }
    canMoveForwardAndKill(team: Teams, rowIndex: number, columnIndex: number) {
        if (!this.isValidPosition(rowIndex, columnIndex)) {
            return false;
        }
        if (this.isOccupied(rowIndex, columnIndex) && this.isOccupiedByEnemy(rowIndex, columnIndex, team)) {
            return true;
        }
        return false;
    }
    updateKingsPosition() {
        this.kingsPosition = [];
        for (const row of this) {
            for (const block of row) {
                if (block.piece && block.piece.type === 'king') {
                    this.kingsPosition.push(block);
                }
            }
        }
    }
    isBlockUnderAttack(blockToCheck: BlockInfo, friendlyTeam: Teams) {
        for (const row of this) {
            for (const block of row) {
                if (block.piece && block.piece.team !== friendlyTeam) {
                    if (block.nextPossibleMoves(this).some(a => a.to === blockToCheck)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    isCheck(friendlyTeam: Teams) {
        return this.isBlockUnderAttack(
            this.getKingPosition(friendlyTeam),
            friendlyTeam
        );
    }
    isCheckAfterMove(move: Move) {
        const simulatingBoard = this.clone();
        move = move.clone();
        move.effect(simulatingBoard);
        const to = simulatingBoard.get(move.to);
        return simulatingBoard.isCheck(to.piece.team);
    }
    get(positionOnBoard: PositionOnBoard) {
        return this[positionOnBoard.rowIndex][positionOnBoard.columnIndex];
    }
    clone() {
        const mewBoard = new BoardInfo();
        for (const row of this) {
            const mewRow = [];
            for (const block of row) {
                const newBlock = new BlockInfo();
                newBlock.piece = block.piece && block.piece.clone();
                newBlock.columnIndex = block.columnIndex;
                newBlock.rowIndex = block.rowIndex;
                mewRow.push(newBlock);
            }
            mewBoard.push(mewRow);
        }
        mewBoard.teamAtTop = this.teamAtTop;
        mewBoard.teamAtBottom = this.teamAtBottom;
        mewBoard.lastMove = this.lastMove;
        mewBoard.updateKingsPosition();
        return mewBoard;
    }
    toBlockArray() {
        return this.reduce((pv, cv) => [...pv, ...cv], []);
    }
    getBlocksOfTeam(team: Teams) {
        return this.toBlockArray().filter(a => a.piece && a.piece.team === team);
    }
    getMovesForTeam(team: Teams) {
        const moves = this.getBlocksOfTeam(team).map(a => this.getMoveForBlock(a)).reduce(
            (pv, cv) => [...pv, ...cv], []
        );
        return moves;
    }
    getMoveForBlock(blockInfo: BlockInfo) {
        if (blockInfo.piece) {
            const moves = blockInfo.nextPossibleMoves(this).filter(a => !this.isCheckAfterMove(a));
            if (blockInfo.piece && blockInfo.piece.type === 'king') {
                this.ruleSet.suggestCaseLinkMoves(this, blockInfo, moves);
            }
            return moves;
        } else {
            return [];
        }
    }
}

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
            this.addMove(possibleMoves, new Move(
                blockInfo, boardInfo[rowIndex][columnIndex], rowIndex === 0 || rowIndex === 7
            ), boardInfo);
            const atInitPosition = yDirection === 1 ? blockInfo.rowIndex === 1 : blockInfo.rowIndex === 6;
            if (atInitPosition) {
                rowIndex = blockInfo.rowIndex + (2 * yDirection);
                if (boardInfo.canMoveForwardTo(rowIndex, columnIndex)) {
                    this.addMove(possibleMoves, new Move(
                        blockInfo, boardInfo[rowIndex][columnIndex], rowIndex === 0 || rowIndex === 7
                    ), boardInfo);
                }
            }
        }
        rowIndex = blockInfo.rowIndex + yDirection;
        columnIndex = blockInfo.columnIndex + 1;
        if (boardInfo.canMoveForwardAndKill(blockInfo.piece.team, rowIndex, columnIndex)) {
            this.addMove(possibleMoves, new Move(
                blockInfo, boardInfo[rowIndex][columnIndex], rowIndex === 0 || rowIndex === 7
            ), boardInfo);
        } else if (this.canEnPassantTo(boardInfo, rowIndex, columnIndex, yDirection)) {
            this.addMove(possibleMoves, new EnPassantMove(
                blockInfo, boardInfo[rowIndex][columnIndex], boardInfo.lastMove.to, rowIndex === 0 || rowIndex === 7
            ), boardInfo);
        }
        columnIndex = blockInfo.columnIndex - 1;
        if (boardInfo.canMoveForwardAndKill(blockInfo.piece.team, rowIndex, columnIndex)) {
            this.addMove(possibleMoves, new Move(
                blockInfo, boardInfo[rowIndex][columnIndex], rowIndex === 0 || rowIndex === 7
            ), boardInfo);
        } else if (this.canEnPassantTo(boardInfo, rowIndex, columnIndex, yDirection)) {
            this.addMove(possibleMoves, new EnPassantMove(
                blockInfo, boardInfo[rowIndex][columnIndex], boardInfo.lastMove.to, rowIndex === 0 || rowIndex === 7
            ), boardInfo);
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
                        this.addMove(
                            possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo
                        );
                    } else {
                        if (boardInfo.isOccupiedByEnemy(rowIndex, columnIndex, blockInfo.piece.team)) {
                            this.addMove(
                                possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo
                            );
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
                        && !boardInfo.isOccupiedByFriend(rowIndex, columnIndex, blockInfo.piece.team)
                    ) {
                        this.addMove(
                            possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo
                        );
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
                        this.addMove(
                            possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo
                        );
                    } else {
                        if (boardInfo.isOccupiedByEnemy(rowIndex, columnIndex, blockInfo.piece.team)) {
                            this.addMove(
                                possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo
                            );
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
                    this.addMove(
                        possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo
                    );
                } else {
                    if (boardInfo.isOccupiedByEnemy(rowIndex, columnIndex, blockInfo.piece.team)) {
                        this.addMove(
                            possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex])
                            , boardInfo
                        );
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
                    for (
                        let columnIndex = blockInfo.columnIndex + directionToCheck;
                        columnIndex > 0 && columnIndex < 7;
                        columnIndex += directionToCheck
                    ) {
                        const block = boardInfo.get({ columnIndex, rowIndex: blockInfo.rowIndex });
                        if (block.isOccupied()) {
                            break;
                        }
                        if (
                            boardInfo.isBlockUnderAttack(block, blockInfo.piece.team)
                        ) {
                            break;
                        }
                        if (columnIndex === 1 || columnIndex === 6) {
                            this.addMove(
                                possibleMoves,
                                new MoveWithSubMove(
                                    blockInfo,
                                    boardInfo.get({
                                        columnIndex: blockInfo.columnIndex + 2 * directionToCheck,
                                        rowIndex: blockInfo.rowIndex
                                    }),
                                    new Move(
                                        boardInfo.get({ columnIndex: columnIndex + directionToCheck, rowIndex: blockInfo.rowIndex }),
                                        boardInfo.get({
                                            columnIndex: blockInfo.columnIndex + directionToCheck,
                                            rowIndex: blockInfo.rowIndex
                                        })
                                    )
                                ), boardInfo
                            );

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
                        this.addMove(
                            possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo
                        );
                    } else {
                        if (boardInfo.isOccupiedByEnemy(rowIndex, columnIndex, blockInfo.piece.team)) {
                            this.addMove(
                                possibleMoves, new Move(blockInfo, boardInfo[rowIndex][columnIndex]), boardInfo
                            );
                        }
                        break;
                    }
                }

            }
        }
    }

}
