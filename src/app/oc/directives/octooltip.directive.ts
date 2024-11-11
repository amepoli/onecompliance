import { Directive, ElementRef, Input, NgZone } from "@angular/core";
import tippy, { Instance } from "tippy.js";

@Directive({ selector: "[ocTooltip]" })
export class OCTooltipDirective {
    private instance: Instance;
    private _content: string;

    get content() {
        return this._content;
    }

    @Input("ocTooltip") set content(content: string) {
        this._content = content;
        if (this.instance) this.instance.setContent(content);
    }

    constructor(
        private host: ElementRef<Element>,
        private zone: NgZone,
    ) {}

    ngAfterViewInit() {
        if (this.content) {
            this.zone.runOutsideAngular(() => {
                this.instance = tippy(this.host.nativeElement, {
                    content: this.content,
                    placement: "top",
                });
            });
        }
    }
}
