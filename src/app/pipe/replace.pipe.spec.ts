import { ReplacePipe } from './replace.pipe';

describe('ReplacePipe', () => {
  const pipe = new ReplacePipe();

  it('substitui o caractere informado', () => {
    expect(pipe.transform('xlf-1212', '-', ' ')).toBe('xlf 1212');
  });

  it('não quebra com valor nulo', () => {
    expect(pipe.transform(null, '-', ' ')).toBe('');
  });
});
