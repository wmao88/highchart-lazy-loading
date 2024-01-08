import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LazyLoadingChartComponent } from './lazy-loading-chart.component';

describe('TimeLineChartComponent', () => {
	let component: LazyLoadingChartComponent;
	let fixture: ComponentFixture<LazyLoadingChartComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [LazyLoadingChartComponent]
		});
		fixture = TestBed.createComponent(LazyLoadingChartComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
