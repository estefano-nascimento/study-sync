import { validateEmail, validatePassword, strengthColor } from '../../lib/validation';

describe('validateEmail', () => {
  describe('required and basic format', () => {
    it('returns error for empty string', () => {
      const result = validateEmail('');
      expect(result).toEqual({ valid: false, error: 'E-mail obrigatório' });
    });

    it('returns error for whitespace-only string', () => {
      const result = validateEmail('   ');
      expect(result).toEqual({ valid: false, error: 'E-mail obrigatório' });
    });

    it('returns error when @ is missing', () => {
      const result = validateEmail('userexample.com');
      expect(result).toEqual({ valid: false, error: 'E-mail deve conter @' });
    });

    it('returns error for multiple @ signs', () => {
      const result = validateEmail('user@@example.com');
      expect(result).toEqual({ valid: false, error: 'E-mail inválido' });
    });

    it('returns error for three @ signs', () => {
      const result = validateEmail('a@b@c@d.com');
      expect(result).toEqual({ valid: false, error: 'E-mail inválido' });
    });
  });

  describe('local part validation', () => {
    it('returns error for empty local part', () => {
      const result = validateEmail('@example.com');
      expect(result).toEqual({ valid: false, error: 'Nome de usuário do e-mail está vazio' });
    });

    it('returns error when local part exceeds 64 characters', () => {
      const longLocal = 'a'.repeat(65);
      const result = validateEmail(`${longLocal}@example.com`);
      expect(result).toEqual({ valid: false, error: 'Nome de usuário do e-mail é muito longo' });
    });

    it('accepts local part with exactly 64 characters', () => {
      const local64 = 'a'.repeat(64);
      const result = validateEmail(`${local64}@example.com`);
      expect(result.valid).toBe(true);
    });
  });

  describe('domain validation', () => {
    it('returns error for empty domain', () => {
      const result = validateEmail('user@');
      expect(result).toEqual({ valid: false, error: 'Domínio do e-mail está vazio' });
    });

    it('returns error for domain without a dot', () => {
      const result = validateEmail('user@localhost');
      expect(result).toEqual({ valid: false, error: 'Domínio inválido — falta o ponto (ex: gmail.com)' });
    });

    it('returns error for domain starting with dot', () => {
      const result = validateEmail('user@.example.com');
      expect(result).toEqual({ valid: false, error: 'Formato de e-mail inválido' });
    });

    it('returns error for domain ending with dot', () => {
      const result = validateEmail('user@example.com.');
      expect(result).toEqual({ valid: false, error: 'Formato de e-mail inválido' });
    });

    it('returns error for domain with consecutive dots', () => {
      const result = validateEmail('user@example..com');
      expect(result).toEqual({ valid: false, error: 'Formato de e-mail inválido' });
    });
  });

  describe('format validation', () => {
    it('returns error for invalid format', () => {
      const result = validateEmail('user name@example.com');
      expect(result).toEqual({ valid: false, error: 'Formato de e-mail inválido' });
    });
  });

  describe('valid emails', () => {
    it('accepts a standard valid email', () => {
      const result = validateEmail('user@gmail.com');
      expect(result).toEqual({ valid: true });
    });

    it('accepts email with dots in local part', () => {
      const result = validateEmail('first.last@example.com');
      expect(result).toEqual({ valid: true });
    });

    it('accepts email with plus sign', () => {
      const result = validateEmail('user+tag@example.com');
      expect(result).toEqual({ valid: true });
    });

    it('trims whitespace and lowercases', () => {
      const result = validateEmail('  User@Gmail.com  ');
      expect(result).toEqual({ valid: true });
    });

    it('accepts email with subdomain', () => {
      const result = validateEmail('user@mail.example.com');
      expect(result).toEqual({ valid: true });
    });
  });

  describe('typo suggestions', () => {
    it('suggests gmail.com for gmial.com', () => {
      const result = validateEmail('user@gmial.com');
      expect(result.valid).toBe(true);
      expect(result.suggestion).toBe('Você quis dizer user@gmail.com?');
    });

    it('suggests hotmail.com for hotmal.com', () => {
      const result = validateEmail('user@hotmal.com');
      expect(result.valid).toBe(true);
      expect(result.suggestion).toBe('Você quis dizer user@hotmail.com?');
    });

    it('suggests outlook.com for outllook.com', () => {
      const result = validateEmail('user@outllook.com');
      expect(result.valid).toBe(true);
      expect(result.suggestion).toBe('Você quis dizer user@outlook.com?');
    });

    it('suggests gmail.com for gmai.com', () => {
      const result = validateEmail('test@gmai.com');
      expect(result.valid).toBe(true);
      expect(result.suggestion).toBe('Você quis dizer test@gmail.com?');
    });

    it('suggests yahoo.com for yaho.com', () => {
      const result = validateEmail('test@yaho.com');
      expect(result.valid).toBe(true);
      expect(result.suggestion).toBe('Você quis dizer test@yahoo.com?');
    });

    it('does not suggest for correct domain', () => {
      const result = validateEmail('user@gmail.com');
      expect(result.valid).toBe(true);
      expect(result.suggestion).toBeUndefined();
    });

    it('does not suggest for unknown domain', () => {
      const result = validateEmail('user@mycompany.com');
      expect(result.valid).toBe(true);
      expect(result.suggestion).toBeUndefined();
    });
  });
});

describe('validatePassword', () => {
  describe('strength levels', () => {
    it('returns fraca with score 25 for empty password', () => {
      const result = validatePassword('');
      expect(result.strength).toBe('fraca');
      expect(result.score).toBe(25);
      expect(result.valid).toBe(false);
    });

    it('returns fraca for short lowercase-only password', () => {
      const result = validatePassword('abc');
      expect(result.strength).toBe('fraca');
      expect(result.valid).toBe(false);
    });

    it('returns media for password with length + upper + lower (3 rules)', () => {
      const result = validatePassword('Abcdefgh');
      expect(result.strength).toBe('média');
      expect(result.score).toBe(50);
      expect(result.valid).toBe(false);
    });

    it('returns muito forte for password meeting all 5 rules', () => {
      const result = validatePassword('Abcdef1!');
      expect(result.strength).toBe('muito forte');
      expect(result.score).toBe(100);
      expect(result.valid).toBe(true);
    });

    it('returns muito forte with score 100 for 12+ char password meeting 4+ rules', () => {
      const result = validatePassword('ABCDEFGh1!@#');
      expect(result.strength).toBe('muito forte');
      expect(result.score).toBe(100);
      expect(result.valid).toBe(true);
    });

    it('returns forte for password meeting exactly 4 rules', () => {
      const result = validatePassword('Abcdef1');
      // length < 8 but has upper + lower + number = 3 rules? No:
      // length >= 8? No (7 chars) -> not met
      // upper? Yes, lower? Yes, number? Yes, symbol? No -> 3 met = media
      // Let's use a proper 4-rule password: 8+ chars, upper, lower, number (no symbol)
      const result2 = validatePassword('Abcdefg1');
      expect(result2.strength).toBe('forte');
      expect(result2.score).toBe(75);
    });
  });

  describe('individual rules', () => {
    it('checks minimum 8 characters rule', () => {
      const short = validatePassword('Ab1!');
      expect(short.rules[0].met).toBe(false);
      expect(short.rules[0].label).toBe('Pelo menos 8 caracteres');

      const long = validatePassword('Abcdefg1!');
      expect(long.rules[0].met).toBe(true);
    });

    it('checks uppercase letter rule', () => {
      const noUpper = validatePassword('abcdefg1!');
      expect(noUpper.rules[1].met).toBe(false);
      expect(noUpper.rules[1].label).toBe('Letra maiúscula (A-Z)');

      const withUpper = validatePassword('Abcdefg1!');
      expect(withUpper.rules[1].met).toBe(true);
    });

    it('checks lowercase letter rule', () => {
      const noLower = validatePassword('ABCDEFG1!');
      expect(noLower.rules[2].met).toBe(false);
      expect(noLower.rules[2].label).toBe('Letra minúscula (a-z)');

      const withLower = validatePassword('Abcdefg1!');
      expect(withLower.rules[2].met).toBe(true);
    });

    it('checks number rule', () => {
      const noNumber = validatePassword('Abcdefgh!');
      expect(noNumber.rules[3].met).toBe(false);
      expect(noNumber.rules[3].label).toBe('Número (0-9)');

      const withNumber = validatePassword('Abcdefg1!');
      expect(withNumber.rules[3].met).toBe(true);
    });

    it('checks symbol rule', () => {
      const noSymbol = validatePassword('Abcdefg1');
      expect(noSymbol.rules[4].met).toBe(false);
      expect(noSymbol.rules[4].label).toBe('Símbolo (!@#$%...)');

      const withSymbol = validatePassword('Abcdefg1!');
      expect(withSymbol.rules[4].met).toBe(true);
    });
  });

  describe('validity', () => {
    it('is valid only when all 5 rules are met', () => {
      expect(validatePassword('Abcdef1!').valid).toBe(true);
      expect(validatePassword('Abcdefgh').valid).toBe(false);
      expect(validatePassword('abcdef1!').valid).toBe(false);
      expect(validatePassword('ABCDEF1!').valid).toBe(false);
      expect(validatePassword('Abcdefg!').valid).toBe(false);
      expect(validatePassword('Abcdefg1').valid).toBe(false);
    });

    it('always returns 5 rules', () => {
      const result = validatePassword('anything');
      expect(result.rules).toHaveLength(5);
    });
  });
});

describe('strengthColor', () => {
  it('returns red for fraca', () => {
    expect(strengthColor('fraca')).toBe('#EF4444');
  });

  it('returns amber for media', () => {
    expect(strengthColor('média')).toBe('#F59E0B');
  });

  it('returns green for forte', () => {
    expect(strengthColor('forte')).toBe('#22C55E');
  });

  it('returns dark green for muito forte', () => {
    expect(strengthColor('muito forte')).toBe('#16A34A');
  });
});
