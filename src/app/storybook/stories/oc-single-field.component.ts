import { Component, Input } from '@angular/core';

import { DynamicFormsSBModule } from '../dynamic-forms-sb/dynamic-forms-sb.module';


@Component({
  selector: 'storybook-oc-single-field',
  templateUrl: './oc-single-field.component.html',
  styleUrls: ['./oc-single-field.component.css'],
  standalone: true,
  imports: [DynamicFormsSBModule],
  // providers: [TimezoneService, ValidationsService, TranslateService, FuseTranslationLoaderService]
})
export class OCSingleFieldComponent {

  @Input() field: any;

}
