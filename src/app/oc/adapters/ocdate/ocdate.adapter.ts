import { NativeDateAdapter } from "@angular/material/core";
import * as moment from "moment";

export class OCDateAdapter extends NativeDateAdapter {
    format(date: Date): string {
      return moment(date).format('DD/MM/YYYY');
    }
  
    parse(value: any): Date | null {
      if (!moment(value, 'DD/MM/YYYY', true).isValid()) {
        return this.invalid();
      }
      return moment(value, 'DD/MM/YYYY', true).toDate();
    }
  }
