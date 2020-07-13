import {
  Pipe,
  PipeTransform
} from '@angular/core';

@Pipe({
    name: 'replace'
})
export class ReplacePipe implements PipeTransform {
  // tslint:disable-next-line:typedef
  transform(value: string, char: string, valueToReplace: string){
      return value.replace(char, valueToReplace);
  }
}