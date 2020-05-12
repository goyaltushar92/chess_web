import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { BoardComponent } from './board/board.component';
import { BlockDirective } from './board/block/block.component';
import { PieceComponent } from './board/pieces/piece/piece.component';

@NgModule({
  declarations: [
    AppComponent,
    BoardComponent,
    BlockDirective,
    PieceComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
