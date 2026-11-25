import {
  addDaysISO,
  brToISO,
  dayLabel,
  isoToBr,
  maskBrDate,
  monthLabel,
  monthRange,
  shiftMonth,
  toISO,
} from '@/utils/date';

describe('datas ISO e brasileiras', () => {
  it('formata uma data local em ISO sem deslocamento de fuso', () => {
    expect(toISO(new Date(2026, 8, 18))).toBe('2026-09-18');
    expect(isoToBr('2026-09-18')).toBe('18/09/2026');
  });

  it('soma dias atravessando mês e ano', () => {
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('converte datas brasileiras válidas para ISO', () => {
    expect(brToISO('25/12/2026')).toBe('2026-12-25');
    expect(brToISO(' 01/09/2026 ')).toBe('2026-09-01');
  });

  it('rejeita datas inexistentes ou em formato incorreto', () => {
    expect(brToISO('31/02/2026')).toBeNull();
    expect(brToISO('2026-09-18')).toBeNull();
  });

  it('aplica máscara DD/MM/AAAA sem exceder oito dígitos', () => {
    expect(maskBrDate('18092026')).toBe('18/09/2026');
    expect(maskBrDate('18a09202699')).toBe('18/09/2026');
  });

  it('desloca meses corretamente através da virada do ano', () => {
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  });

  it('calcula intervalo semiaberto do mês', () => {
    expect(monthRange({ year: 2026, month: 12 })).toEqual({
      start: '2026-12-01',
      endExclusive: '2027-01-01',
    });
  });

  it('mostra o nome do mês em português', () => {
    expect(monthLabel({ year: 2026, month: 9 })).toBe('Setembro 2026');
  });

  it('rotula hoje e ontem e formata outros dias', () => {
    expect(dayLabel('2026-09-18', '2026-09-18')).toBe('Hoje');
    expect(dayLabel('2026-09-17', '2026-09-18')).toBe('Ontem');
    expect(dayLabel('2026-09-10', '2026-09-18')).toBe('10/09');
  });
});
