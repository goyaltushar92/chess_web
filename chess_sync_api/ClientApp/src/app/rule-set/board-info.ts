import { BlockInfo } from '../block-info/block-info';
import { Teams, Piece } from '../board/pieces/base-piece';
import { PositionOnBoard } from '../block-info/position-on-board';
import { Move } from '../board/moves/move';
import { RuleSet } from './rule-set.service';
export class BoardInfo extends Array<Array<BlockInfo>> {
  ruleSet: RuleSet;
  teamAtTop: Teams;
  teamAtBottom: Teams;
  lastMove: Move;
  kingsPosition: BlockInfo[];
  pieces: Piece[];
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
    return this.isBlockUnderAttack(this.getKingPosition(friendlyTeam), friendlyTeam);
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
    mewBoard.pieces = [];
    for (const row of this) {
      const mewRow = [];
      for (const block of row) {
        const newBlock = block.clone();
        if (newBlock.piece) {
          mewBoard.pieces.push(newBlock.piece);
        }
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
    const moves = this.getBlocksOfTeam(team).map(a => this.getMoveForBlock(a)).reduce((pv, cv) => [...pv, ...cv], []);
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
