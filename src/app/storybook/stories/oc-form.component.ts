import { Component, Input } from '@angular/core';

import { DynamicFormsSBModule } from '../dynamic-forms-sb/dynamic-forms-sb.module';


@Component({
  selector: 'storybook-oc-form',
  templateUrl: './oc-form.component.html',
  styleUrls: ['./oc-form.component.css'],
  standalone: true,
  imports: [DynamicFormsSBModule],
  // providers: [TimezoneService, ValidationsService, TranslateService, FuseTranslationLoaderService]
})
export class OCFormComponent {

  @Input() fields: any;

}
