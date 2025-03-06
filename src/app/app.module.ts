import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatGridList, MatGridListModule } from '@angular/material/grid-list';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatGridTile } from '@angular/material/grid-list';
import { MatGridAvatarCssMatStyler } from '@angular/material/grid-list';
import { ChatComponent } from './Chat/chat/chat.component';

@NgModule({
  declarations: [
    AppComponent,ChatComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatGridListModule,
    BrowserAnimationsModule,MatGridTile,MatGridAvatarCssMatStyler,MatGridList
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
