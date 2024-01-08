import { Component } from '@angular/core';
import * as Highcharts from 'highcharts';
import HC_stock from 'highcharts/modules/stock';
import { AppleDataService } from './apple-data.service';

import { Observable } from 'rxjs';

HC_stock(Highcharts);

interface ExtendedPlotCandlestickDataGroupingOptions extends Highcharts.DataGroupingOptionsObject {
	enabled: boolean;
}

@Component({
	selector: 'app-lazy-loading-chart',
	templateUrl: './lazy-loading-chart.component.html',
	styleUrls: ['./lazy-loading-chart.component.scss']
})
export class LazyLoadingChartComponent {
	chartData: any = [];
	updateFlag = false;
	// global variable to track if extremes set due to manually navigator movement
	private isExtremesSetDueToNavigatorMove = false;

	constructor(private appleDataService: AppleDataService) {
		const data = this.fetchData().subscribe((data) => {
			// Add a null value for the end date
			this.chartData = [...(data as Array<any>), [Date.UTC(2011, 9, 14, 19, 59), null, null, null, null]];
		});
	}

	Highcharts: typeof Highcharts = Highcharts;

	chartRef!: any; //Highcharts.Chart;

	chartCallback: Highcharts.ChartCallbackFunction = (chart) => {
		this.chartRef = chart;
	};

	fetchData(): Observable<Object> {
		return this.appleDataService.fetchData();
	}

	fetchSqlData(min: number, max: number): Observable<Object> {
		return this.appleDataService.fetchSqlData(min, max);
	}

	updateChart() {
		let previousTime = 1317420000000; // this is last datapoint timestamp oct 01 2011
		const increment = 2952000000; // approx 1 month millis

		setInterval(() => {
			let x = new Date(previousTime + increment).getTime();
			const newPoint = [x, 306.06, 338.74, 304.64, 335.4, 401348260];

			this.chartRef.series[0].addPoint(newPoint, true, this.chartRef.series[0].data.length >= 200);
			const navigatorSeries = this.chartRef.navigator.series[0];
			navigatorSeries.addPoint(newPoint, true);

			// this.chartRef.update({
			// 	navigator: {
			// 		series: {
			// 			data: this.chartData
			// 		}
			// 	}
			// });

			previousTime = previousTime + increment;
			this.updateFlag = true;
		}, 1000);
	}

	private setExtremes(event: any) {
		this.isExtremesSetDueToNavigatorMove = true;
	}

	private afterSetExtremes(e: any) {
		if (this.isExtremesSetDueToNavigatorMove && e.max !== e.dataMax) {
			const dataURL = 'https://demo-live-data.highcharts.com/aapl-historical.json';
			this.chartRef.showLoading('Loading data from server..., fetch: ');
			console.log('loading data: ', `${dataURL}?start=${Math.round(e.min)}&end=${Math.round(e.max)}`);

			// Load new data depending on the selected min and max
			fetch(`${dataURL}?start=${Math.round(e.min)}&end=${Math.round(e.max)}`)
				.then((res) => res.ok && res.json())
				.then((data) => {
					this.chartRef.series[0].setData(data);
					this.chartRef.hideLoading();
					this.updateFlag = true;
				})
				.catch((error) => console.error(error.message));

			this.chartRef.hideLoading();
		}

		this.isExtremesSetDueToNavigatorMove = false;
	}

	chartLazyLoading: Highcharts.Options = {
		chart: {
			type: 'candlestick',
			zooming: {
				type: 'x'
			},
			events: {
				load: () => {
					const chart = this.chartRef;
					const data = this.fetchData().subscribe((data) => {
						// Add a null value for the end date
						this.chartData = [
							...(data as Array<any>),
							[Date.UTC(2011, 9, 14, 19, 59), null, null, null, null]
						];

						chart.addSeries(
							{
								type: 'candlestick',
								data: this.chartData,
								dataGrouping: {
									enabled: false
								} as ExtendedPlotCandlestickDataGroupingOptions
							},
							false
						);

						chart.update({
							navigator: {
								series: {
									data: this.chartData
								},
								stickToMax: true
							}
						});

						this.updateChart();
					});
				}
			}
		},

		navigator: {
			adaptToUpdatedData: true
		},

		scrollbar: {
			liveRedraw: false
		},

		title: {
			text: 'AAPL history by the minute from 1998 to 2011'
		},

		subtitle: {
			text: 'Displaying 1.7 million data points in Highcharts Stock by async server loading'
		},

		rangeSelector: {
			enabled: false
		},

		xAxis: {
			events: {
				afterSetExtremes: (event) => this.afterSetExtremes(event),
				setExtremes: (event) => this.setExtremes(event)
			},
			minRange: 0 // one hour,
			// range: 2 * 3600 * 1000
		},

		yAxis: {
			floor: 0
		}
	};
}
