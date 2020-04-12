import { Piece, PieceType, Move } from './base-piece';
import { BoardInfo, RuleSet } from 'src/app/rule-set/rule-set.service';
import { BlockInfo } from 'src/app/block-info/block-info';

export class Pyada extends Piece {
    constructor(ruleSet: RuleSet, team: 'black' | 'white') {
        super(ruleSet, team);
    }
    get type(): PieceType {
        return 'pyada';
    }
    nextPossibleMoves(boardInfo: BoardInfo, blockInfo: BlockInfo): Move[] {
        const possibleMoves: Move[] = [];
        this.ruleSet.suggestForPyada(boardInfo, blockInfo, possibleMoves);
        return possibleMoves;
    }
}

export class Elephant extends Piece {
    constructor(ruleSet: RuleSet, team: 'black' | 'white') {
        super(ruleSet, team);
    }
    get type(): PieceType {
        return 'elephant';
    }
    nextPossibleMoves(boardInfo: BoardInfo, blockInfo: BlockInfo): Move[] {
        const possibleMoves: Move[] = [];
        this.ruleSet.suggestForElephant(boardInfo, blockInfo, possibleMoves);
        return possibleMoves;
    }
}

export class Horse extends Piece {
    constructor(ruleSet: RuleSet, team: 'black' | 'white') {
        super(ruleSet, team);
    }
    get type(): PieceType {
        return 'horse';
    }
    nextPossibleMoves(boardInfo: BoardInfo, blockInfo: BlockInfo): Move[] {
        const possibleMoves: Move[] = [];
        this.ruleSet.suggestForHorse(boardInfo, blockInfo, possibleMoves);
        return possibleMoves;
    }
}

export class Camel extends Piece {
    constructor(ruleSet: RuleSet, team: 'black' | 'white') {
        super(ruleSet, team);
    }
    get type(): PieceType {
        return 'camel';
    }
    nextPossibleMoves(boardInfo: BoardInfo, blockInfo: BlockInfo): Move[] {
        const possibleMoves: Move[] = [];
        this.ruleSet.suggestForCamel(boardInfo, blockInfo, possibleMoves);
        return possibleMoves;
    }
}

export class King extends Piece {
    constructor(ruleSet: RuleSet, team: 'black' | 'white') {
        super(ruleSet, team);
    }
    get type(): PieceType {
        return 'king';
    }
    nextPossibleMoves(boardInfo: BoardInfo, blockInfo: BlockInfo): Move[] {
        const possibleMoves: Move[] = [];
        this.ruleSet.suggestForKing(boardInfo, blockInfo, possibleMoves);
        return possibleMoves;
    }
}

export class Queen extends Piece {
    constructor(ruleSet: RuleSet, team: 'black' | 'white') {
        super(ruleSet, team);
    }
    get type(): PieceType {
        return 'queen';
    }
    nextPossibleMoves(boardInfo: BoardInfo, blockInfo: BlockInfo): Move[] {
        const possibleMoves: Move[] = [];
        this.ruleSet.suggestForQueen(boardInfo, blockInfo, possibleMoves);
        return possibleMoves;
    }
}
