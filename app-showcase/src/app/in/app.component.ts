import { Component } from '@angular/core';
import { Showcase, Component as ComponentShowcase } from '../_types/showcaseType';

// #memo - this files needs to be generated using `npm run generate-file-list`
import { showcases } from '../../showcases';

@Component({
	selector: 'app-app',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent {
	public showcases: Showcase[] = showcases;

	public forceComponentToRefresh = false;

	/* Property for displaying the background grid */
	public showBackgroundGrid = false;

	public toggleComponentsMode(): void {
		this.showcases.forEach((showcase: Showcase): void => {
			showcase.components.forEach((component: ComponentShowcase): void => {
				component.properties.mode = component.properties.mode === 'view' ? 'edit' : 'view';
			});
		});

		this.forceComponentToRefresh = !this.forceComponentToRefresh;

		setTimeout(() => {
			this.forceComponentToRefresh = !this.forceComponentToRefresh;
		}, 0);
	}

	public toggleBackgroundGrid(): void {
		this.showBackgroundGrid = !this.showBackgroundGrid;
	}
}
