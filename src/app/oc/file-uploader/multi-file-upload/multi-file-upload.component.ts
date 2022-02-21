import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-multi-file-upload',
  templateUrl: './multi-file-upload.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: MultiFileUploadComponent,
      multi: true
    }
  ],
  styleUrls: ['./multi-file-upload.component.scss']
})
export class MultiFileUploadComponent implements ControlValueAccessor {
  @Input() progress;
  onChange: Function;
  files: File[] | null = null;

  @ViewChild('fileInput') fileInput: ElementRef;

  // @HostListener('change', ['$event.target.files'])
  emitFiles( event: FileList ) {    
    this.files = [];// file;
    if(event && event.length) {
      for(let i = 0; i < event.length; i++) {
        this.files.push(event.item(i));        
      }
      this.onChange(this.files);
      this.fileInput.nativeElement.value = "";
    }
  }

  constructor( private host: ElementRef<HTMLInputElement> ) {
  }

  writeValue( value: null ) {
    // clear file input
    this.host.nativeElement.value = '';
    this.files = null;
  }

  registerOnChange( fn: Function ) {
    this.onChange = fn;
  }

  registerOnTouched( fn: Function ) {
  }

}
