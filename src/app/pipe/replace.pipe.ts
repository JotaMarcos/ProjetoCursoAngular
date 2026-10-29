import {
  Pipe,
  PipeTransform
} from '@angular/core';

@Pipe({
    name: 'replace',
    standalone: false
})
export class ReplacePipe implements PipeTransform {
  transform(value: string | null | undefined, char: string, valueToReplace: string): string {
      return (value ?? '').replace(char, valueToReplace);
  }
}
