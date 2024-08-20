import { Component, Input } from '@angular/core';

import { NDModule } from '../../oc/nd/nd.module';


@Component({
  selector: 'storybook-oc-button',
  templateUrl: './oc-button.component.html',
  styleUrls: ['./oc-button.component.css'],
  standalone: true,
  imports: [NDModule],
  // providers: [TimezoneService, ValidationsService, TranslateService, FuseTranslationLoaderService]
})
export class OCButtonComponent {

  @Input()
  type?: 'primary' | 'secondary' | 'light';

  @Input()
  label: string;

  @Input()
  disabled: boolean;

  @Input()
  size?:  'normal' | 'large';

}
