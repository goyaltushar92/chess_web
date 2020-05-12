import { PieceType } from '../board/pieces/base-piece';
import { PositionOnBoard } from "../block-info/position-on-board";

import { Injectable, EventEmitter } from '@angular/core';
import * as signalR from '@microsoft/signalr';

// export abstract class SyncMsg {
//     action: 'resign' | 'requestDraw' | 'sync' | 'start' | 'promote';

// }
// export class MoveSyncMsg extends SyncMsg {
//     from: PositionOnBoard;
//     to: PositionOnBoard;
//     constructor(move: Move) {
//         super();
//         this.action = 'sync';
//         this.from = this.calculatePositionOnRotatedBoard(move.from);
//         this.to = this.calculatePositionOnRotatedBoard(move.to);
//     }
//     calculatePositionOnRotatedBoard(position: PositionOnBoard): PositionOnBoard {
//         return { columnIndex: 7 - position.columnIndex, rowIndex: 7 - position.rowIndex };
//     }
// }
// export class StartSyncMsg extends SyncMsg {
//     teamOnTop: Teams;
//     constructor(boardInfo: BoardInfo) {
//         super();
//         this.teamOnTop = boardInfo.teamAtBottom;
//     }
// }
// export const PEER_ID = new InjectionToken('PEER_ID');
// export const PEER_OPTIONS = new InjectionToken('PEER_OPTIONS');

// export abstract class SignalingService {
//     getPeerId(): Promise<string>;

// }
@Injectable({
    providedIn: 'root'
})

export class SyncConnection {
    connection: signalR.HubConnection;
    initBoard = new EventEmitter<string>();
    move = new EventEmitter<{ from: PositionOnBoard, to: PositionOnBoard, promptTo?: PieceType }>();
    // endGame = new EventEmitter();
    // connectionClose = new EventEmitter();
    abort = new EventEmitter();
    constructor() {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl('/hub')
            .build();

        this.connection.on('initBoard', (ontop?: string) => {
            this.initBoard.emit(ontop);
        });

        this.connection.on('move', (from: PositionOnBoard, to: PositionOnBoard, promptTo?: PieceType) => {
            this.move.emit({ from, to, promptTo });
        });
        this.connection.on('abort', () => {
            this.abort.emit();
        });
    }
    gameEnded(): Promise<void> {
        return this.connection.send(
            'GameEnded'
        );
    }
    requestPartner(): Promise<void> {
        if (this.connection.state === signalR.HubConnectionState.Connected) {
            return this.connection.send('SearchPartner');
        }
        return this.connection.start().then(() => this.requestPartner());
    }
    syncMove(from: PositionOnBoard, to: PositionOnBoard, promoteTo?: PieceType) {
        return this.connection.send(
            'Move',
            { rowIndex: from.rowIndex, columnIndex: from.columnIndex },
            { rowIndex: to.rowIndex, columnIndex: to.columnIndex },
            promoteTo
        );
    }

    disconnect() {
        return this.connection.stop();
    }
}
