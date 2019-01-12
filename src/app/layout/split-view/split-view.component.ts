import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { SplitComponent } from 'angular-split';
import { GenericTableService } from 'app/gorico/generic-table/generic-table.service';
import { Event } from 'aws-sdk/clients/dms';

@Component({
  selector: 'split-view',
  templateUrl: './split-view.component.html',
  styleUrls: ['./split-view.component.scss']
})
export class SplitViewComponent implements OnInit {

  @ViewChild('splitComp') splitComp: SplitComponent;

  top_drag_size = 70; 
  top_size = 70; // initial ratio is 70:30
  bottom_size = 100 - this.top_size;  
  previousSize = 0;
  screenSize: number;
  docSize: number;

  constructor(private el: ElementRef,
              private bottomAreaService: GenericTableService) {
   }

  ngOnInit() {

    setTimeout(() => { 
        this.setTopSize(); // wait a bit so the bottom table is rendered
        this.previousSize = this.docSize;
    }, 500);

    this.splitComp.dragEnd.subscribe((result) => {
        this.top_drag_size = result.sizes[0] * this.previousSize / this.screenSize;
        this.setTopSize();  
    });
      
  }

    // recalculate the size on every click on the document
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event): void { 
        this.setTopSize();
        this.previousSize = this.docSize;
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: Event): void{
        this.setTopSize();
        this.previousSize = this.docSize;
    }

  private setTopSize(): void {
    this.screenSize = window.innerHeight;
    this.docSize = this.el.nativeElement.offsetHeight;
    this.top_size = this.top_drag_size * this.screenSize / this.docSize;
    this.bottom_size = 100 - this.top_size; 
    console.log(this.docSize, this.top_size);
  }

}
