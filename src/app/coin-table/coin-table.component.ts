import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { 
  MatTableDataSource, 
  MatPaginator, MatSort, 
  MatBottomSheet, 
  MatBottomSheetRef, 
  MAT_BOTTOM_SHEET_DATA,
  MatSnackBar
 } from '@angular/material';
import { CoinService } from '../coin.service';
import { Coin } from '../models';
import { interval, Observable } from 'rxjs';

@Component({
  selector: 'app-coin-table',
  templateUrl: './coin-table.component.html',
  styleUrls: ['./coin-table.component.css']
})
export class CoinTableComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['cmc_rank', 'symbol', 'price', 'percent_change_1h', 'percent_change_24h', 'percent_change_7d'];
  dataSource: MatTableDataSource<Coin>;
  searchTerm: string = '';
  isTableLoading = false;
  updateDate: Date;
  lastUpdated: string;
  refreshInterval: Observable<number>;

  constructor(private coinService: CoinService, private bottomSheet: MatBottomSheet, public snackBar: MatSnackBar) {}

  ngOnInit() {
    this.initCoinTable();
  }

  async initCoinTable() {
    this.dataSource = new MatTableDataSource();
    await this.refreshTableData();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
/*     this.refreshInterval = interval(300000); // 5 min
    this.refreshInterval.subscribe(n => {
      this.refreshTableData();
    });
    if (!this.coinService.isVisibilityListenerAdded) {
      this.coinService.isVisibilityListenerAdded = true;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.isTableLoading) {
        this.refreshTableData();
      }});
    } */
  }

  async refreshTableData() {
    this.isTableLoading = true;
    let coins = await this.coinService.getCoinList().toPromise();
    coins.forEach(coin => {
        coin.price = coin.quote.USD.price;
        coin.percent_change_1h = coin.quote.USD.percent_change_1h;
        coin.percent_change_24h = coin.quote.USD.percent_change_24h;
        coin.percent_change_7d = coin.quote.USD.percent_change_7d;
    });
    this.dataSource.data = coins;
    this.isTableLoading = false;
    this.updateDate = new Date();
    this.lastUpdated = this.updateDate.toLocaleTimeString()
    this.openSnackBar(`Refreshed: ${this.lastUpdated}`);
  }

  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  getPercentClass(percent: number) {
    if (percent > 0) {
      return 'pump';
    } else if (percent < 0) {
      return 'dump';
    } else {
      return '';
    }
  }

  openBottomSheet(id: number): void {
    let selectedCoin = this.dataSource.data.find(coin => coin.id === id);
    selectedCoin.img = `https://s2.coinmarketcap.com/static/img/coins/16x16/${selectedCoin.id}.png`;
    selectedCoin.chart = `https://s2.coinmarketcap.com/generated/sparklines/web/7d/usd/${selectedCoin.id}.png`;
    this.bottomSheet.open(CoinBottomSheet, {
      data: selectedCoin
    });
  }

  openSnackBar(message: string) {
    this.snackBar.open(message, 'Dismiss', { duration: 3000 });
  }
}

@Component({
  selector: 'coin-bottom-sheet',
  templateUrl: 'coin-bottom-sheet.html',
})
export class CoinBottomSheet {
  constructor(private bottomSheetRef: MatBottomSheetRef<CoinBottomSheet>, @Inject(MAT_BOTTOM_SHEET_DATA) public data: any) {}

  openLink(event: MouseEvent): void {
    this.bottomSheetRef.dismiss();
    event.preventDefault();
  }
}