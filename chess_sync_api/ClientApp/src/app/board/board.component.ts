import { Component, OnInit } from '@angular/core';
import { BlockInfo } from '../block-info/block-info';
import { DefaultRuleSet, BoardInfo } from '../rule-set/rule-set.service';
import { Move, Piece, Teams, PositionOnBoard, PieceType } from './pieces/base-piece';
import { SyncConnection } from '../peer-sync/peer-sync.service';
// import { PeerSyncConnection } from '../peer-sync/peer-sync.service';
@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  boardInfo: BoardInfo;
  suggestedMoves: Move[] = [];
  suggestingFor: BlockInfo;
  killed: Piece[] = [];
  promotableTo: Piece[];
  blockInCheck: BlockInfo;
  gameEndResult: Teams | 'draw' = 'black';
  partnerRequested = false;
  isRemoteApp = false;
  constructor(
    private ruleSet: DefaultRuleSet,
    private syncConnection: SyncConnection) {

  }

  ngOnInit(): void {
    this.syncConnection.initBoard.subscribe((onTop: Teams) => {
      this.resetGameState(onTop === 'white');
      this.isRemoteApp = true;
    });
    this.syncConnection.move.subscribe(({ from, to, promptTo }: { from: PositionOnBoard, to: PositionOnBoard, promptTo?: PieceType }) => {
      console.log(from, to, promptTo);
      this.suggest(this.boardInfo.get(from));
      this.tryToMove(this.boardInfo.get(to), true, promptTo);
    });
    this.syncConnection.abort.subscribe(() => {
      this.gameEndResult = this.boardInfo.teamAtBottom;
    });
  }
  resetGameState(whiteOnTop?: boolean) {
    const boardInfo = this.ruleSet.createNewBoard(whiteOnTop);
    this.resetComponent(boardInfo);
  }
  private resetComponent(boardInfo: BoardInfo) {
    this.boardInfo = boardInfo;
    this.suggestedMoves = [];
    this.suggestingFor = undefined;
    this.killed = [];
    this.promotableTo = undefined;
    this.blockInCheck = undefined;
    this.gameEndResult = undefined;
    this.partnerRequested = false;
    this.isRemoteApp = false;
  }

  startRemoteGame() {
    this.syncConnection.requestPartner().then(() => this.partnerRequested = true);
  }
  suggestOrMove(block: BlockInfo) {
    if (!(this.suggestingFor && this.tryToMove(block))) {
      if (!this.isRemoteApp || (block.piece && block.piece.team === this.boardInfo.teamAtBottom)) {
        this.suggest(block);
      }
    }
  }
  suggest(block: BlockInfo) {
    if (block.piece && block.piece.team === this.boardInfo.nextMoveOfTeam) {
      this.suggestedMoves = this.boardInfo.getMoveForBlock(block);
      this.suggestingFor = block;
    } else {
      this.suggestingFor = undefined;
      this.suggestedMoves = [];
    }
  }
  tryToMove(block: BlockInfo, isSyncMove: boolean = false, promptTo?: PieceType) {
    const move = this.moveFromSuggestions(this.suggestingFor, block);
    if (move) {
      this.executeMove(move, isSyncMove, promptTo);
      return true;
    } else {
      return false;
    }
  }

  onPromptSelection = (piece: Piece) => { };
  private executeMove(move: Move, isSyncMove: boolean = false, promptTo?: PieceType) {
    const killed = move.effect(this.boardInfo);
    if (killed) {
      this.killed.push(killed);
    }
    this.suggestingFor = undefined;
    this.suggestedMoves = [];
    if (move.canPromote) {
      const promptForBlock = this.boardInfo.get(move.to);
      this.promotableTo = this.ruleSet.createPromptArray(
        promptForBlock.piece.team
      );
      this.onPromptSelection = (a) => {
        promptForBlock.piece = a;
        this.promotableTo = undefined;
        this.afterMove(this.boardInfo);
        if (!isSyncMove && this.isRemoteApp) {
          this.syncConnection.syncMove(move.from, move.to, a.type);
        }
      };
      if (isSyncMove) {
        this.onPromptSelection(this.promotableTo.find(a => a.type === promptTo));
      }
    } else {
      this.afterMove(this.boardInfo);
      if (!isSyncMove && this.isRemoteApp) {
        this.syncConnection.syncMove(move.from, move.to);
      }
    }
  }
  moveFromSuggestions(from: BlockInfo, to: BlockInfo) {
    return this.suggestedMoves.find(a => a.from === from && a.to === to);
  }
  isBlockInSuggestedTargets(to: BlockInfo) {
    return this.suggestedMoves.some(a => a.to === to);
  }
  afterMove(boardInfo: BoardInfo) {
    const allPossibleMoves = boardInfo.getMovesForTeam(boardInfo.nextMoveOfTeam);
    this.blockInCheck = boardInfo.isCheck(boardInfo.nextMoveOfTeam) ? boardInfo.getKingPosition(boardInfo.nextMoveOfTeam) : undefined;
    if (this.blockInCheck) {
      if (!allPossibleMoves.length) {
        this.gameEndResult = boardInfo.lastMoveOfTeam;
        if (this.isRemoteApp) {
          this.syncConnection.gameEnded();
        }
      }
    } else {
      if (!allPossibleMoves.length) {
        this.gameEndResult = 'draw';
        if (this.isRemoteApp) {
          this.syncConnection.gameEnded();
        }
      }
      const teamMates = boardInfo.getBlocksOfTeam(boardInfo.nextMoveOfTeam);
      if (teamMates.length === 2 && teamMates.some(a => a.piece.type === 'camel')) {
        this.gameEndResult = 'draw';
        if (this.isRemoteApp) {
          this.syncConnection.gameEnded();
        }
      }
    }
  }
}
