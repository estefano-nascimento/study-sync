const COMMON_DOMAINS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.com.br': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hitmail.com': 'hotmail.com',
  'htomail.com': 'hotmail.com',
  'outllook.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'outloock.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outlookk.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahho.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'iclod.com': 'icloud.com',
  'icluod.com': 'icloud.com',
  'icloud.con': 'icloud.com',
  'protonmal.com': 'protonmail.com',
  'protonmai.com': 'protonmail.com',
  'protonmail.con': 'protonmail.com',
  'live.con': 'live.com',
  'lve.com': 'live.com',
};

const VALID_TLDS = [
  'com', 'com.br', 'net', 'org', 'edu', 'edu.br', 'gov', 'gov.br',
  'io', 'co', 'me', 'info', 'biz', 'app', 'dev', 'br',
];

export interface EmailValidation {
  valid: boolean;
  error?: string;
  suggestion?: string;
}

export function validateEmail(email: string): EmailValidation {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, error: 'E-mail obrigatório' };
  }

  if (!trimmed.includes('@')) {
    return { valid: false, error: 'E-mail deve conter @' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: 'E-mail inválido' };
  }

  const [local, domain] = parts;

  if (!local || local.length === 0) {
    return { valid: false, error: 'Nome de usuário do e-mail está vazio' };
  }

  if (!domain || domain.length === 0) {
    return { valid: false, error: 'Domínio do e-mail está vazio' };
  }

  if (local.length > 64) {
    return { valid: false, error: 'Nome de usuário do e-mail é muito longo' };
  }

  if (!domain.includes('.')) {
    return { valid: false, error: 'Domínio inválido — falta o ponto (ex: gmail.com)' };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Formato de e-mail inválido' };
  }

  if (domain.startsWith('.') || domain.endsWith('.')) {
    return { valid: false, error: 'Domínio do e-mail inválido' };
  }

  if (domain.includes('..')) {
    return { valid: false, error: 'Domínio do e-mail contém pontos consecutivos' };
  }

  const correctedDomain = COMMON_DOMAINS[domain];
  if (correctedDomain) {
    return {
      valid: true,
      suggestion: `Você quis dizer ${local}@${correctedDomain}?`,
    };
  }

  return { valid: true };
}

export interface PasswordRule {
  label: string;
  met: boolean;
}

export interface PasswordValidation {
  valid: boolean;
  rules: PasswordRule[];
  strength: 'fraca' | 'média' | 'forte' | 'muito forte';
  score: number;
}

export function validatePassword(password: string): PasswordValidation {
  const rules: PasswordRule[] = [
    { label: 'Pelo menos 8 caracteres', met: password.length >= 8 },
    { label: 'Letra maiúscula (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Letra minúscula (a-z)', met: /[a-z]/.test(password) },
    { label: 'Número (0-9)', met: /[0-9]/.test(password) },
    { label: 'Símbolo (!@#$%...)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const metCount = rules.filter((r) => r.met).length;
  const valid = metCount === rules.length;

  let strength: PasswordValidation['strength'];
  let score: number;

  if (metCount <= 2) {
    strength = 'fraca';
    score = 25;
  } else if (metCount === 3) {
    strength = 'média';
    score = 50;
  } else if (metCount === 4) {
    strength = 'forte';
    score = 75;
  } else {
    strength = 'muito forte';
    score = 100;
  }

  if (password.length >= 12 && metCount >= 4) {
    strength = 'muito forte';
    score = 100;
  }

  return { valid, rules, strength, score };
}

export function strengthColor(strength: PasswordValidation['strength']): string {
  switch (strength) {
    case 'fraca': return '#EF4444';
    case 'média': return '#F59E0B';
    case 'forte': return '#22C55E';
    case 'muito forte': return '#16A34A';
  }
}
