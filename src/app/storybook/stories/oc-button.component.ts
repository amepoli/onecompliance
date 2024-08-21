import { Component, Input } from '@angular/core';

import { NDModule } from '../../oc/nd/nd.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';


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
  type?: 'filled' | 'outlined' | 'text' = 'filled';

  @Input()
  label: string = '';

  @Input()
  disabled: boolean = false;

  @Input()
  size?:  'small' | 'large' = 'small';

  @Input()
  prefixIcon: string;

  @Input()
  postfixIcon: string;


}
