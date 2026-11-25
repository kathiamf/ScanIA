import { formatMoney, parseMoney, roundMoney, toInputMoney } from '@/utils/money';

describe('parseMoney', () => {
  it('aceita vírgula decimal', () => {
    expect(parseMoney('10,5')).toBe(10.5);
    expect(parseMoney('0,99')).toBe(0.99);
  });

  it('aceita ponto como separador de milhar', () => {
    expect(parseMoney('1.234')).toBe(1234);
    expect(parseMoney('1.234.567,89')).toBe(1234567.89);
  });

  it('aceita ponto decimal sem separador de milhar', () => {
    expect(parseMoney('12.5')).toBe(12.5);
  });

  it('remove símbolo de moeda e espaços', () => {
    expect(parseMoney('R$ 1.234,56')).toBe(1234.56);
  });

  it('devolve NaN para texto sem valor', () => {
    expect(Number.isNaN(parseMoney(''))).toBe(true);
    expect(Number.isNaN(parseMoney('valor'))).toBe(true);
  });
});

describe('formatMoney', () => {
  it('formata reais no padrão brasileiro', () => {
    expect(formatMoney(1234.5).replace(/[\u00a0\u202f]/g, ' ')).toBe('R$ 1.234,50');
  });
});

describe('roundMoney', () => {
  it('arredonda valores para centavos e para texto de campo', () => {
    expect(roundMoney(1.005)).toBe(1);
    expect(toInputMoney(1234.5)).toBe('1234,50');
  });
});
