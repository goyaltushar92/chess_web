import { Piece, PieceType } from './base-piece';
import { Move } from '../moves/move';
import { RuleSet } from 'src/app/rule-set/rule-set.service';
import { BoardInfo } from 'src/app/rule-set/board-info';
import { BlockInfo } from 'src/app/block-info/block-info';
export class Elephant extends Piece {
  constructor(ruleSet: RuleSet, team: 'black' | 'white') {
    super(ruleSet, team);
  }
  get weight() {
    return 7;
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
