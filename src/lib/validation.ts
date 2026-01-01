// lib/validation.ts
// Real phone number and email validation with carrier detection

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  countryCode: string;
  nationalNumber: string;
  type: 'mobile' | 'landline' | 'voip' | 'toll_free' | 'unknown';
  carrier?: string;
  region?: string;
  isPossibleBurner: boolean;
  confidence: number;
  reason?: string;
}

export interface EmailValidationResult {
  isValid: boolean;
  email: string;
  domain: string;
  isDisposable: boolean;
  isCorporate: boolean;
  isFreeProvider: boolean;
  mxValid: boolean;
  confidence: number;
  provider?: string;
  riskLevel: 'low' | 'medium' | 'high';
  reason?: string;
}

// Common disposable email domains - extensive list
const DISPOSABLE_DOMAINS = new Set([
  // Temporary mail services
  'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'guerrillamail.org',
  'sharklasers.com', 'grr.la', 'guerrillamailblock.com', 'pokemail.net',
  'spam4.me', 'mailinator.com', 'mailinator2.com', 'mailinater.com',
  'throwaway.email', 'fakeinbox.com', 'trashmail.com', 'trashmail.net',
  'getairmail.com', 'getnada.com', 'tempail.com', 'tempr.email',
  'discard.email', 'discardmail.com', 'mailnesia.com', 'mintemail.com',
  'mohmal.com', 'throwawaymail.com', 'yopmail.com', 'yopmail.fr',
  '10minutemail.com', '10minutemail.net', 'minutemail.com', '10minmail.com',
  'emailondeck.com', 'burnermail.io', 'maildrop.cc', 'mailsac.com',
  'inboxkitten.com', 'disposableemailaddresses.com', 'tempmailaddress.com',
  'fakemailgenerator.com', 'emailfake.com', 'crazymailing.com',
  'tempinbox.com', 'disposable.com', 'mailcatch.com', 'spamgourmet.com',
  'mytrashmail.com', 'mt2009.com', 'trash2009.com', 'trashymail.com',
  'antispam24.de', 'spamfree24.org', 'spamfree24.de', 'spamfree24.info',
  'emailsensei.com', 'armyspy.com', 'cuvox.de', 'dayrep.com', 'einrot.com',
  'fleckens.hu', 'gustr.com', 'jourrapide.com', 'rhyta.com', 'superrito.com',
  'teleworm.us', 'tempomail.fr', 'dispostable.com', 'mailforspam.com',
  'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.info', 'guerrillamail.net',
  'spamex.com', 'spam.la', 'safetymail.info', 'mailmetrash.com', 'thankyou2010.com',
  'trash-mail.at', 'trashmail.at', 'objectmail.com', 'proxymail.eu', 'rcpt.at',
  'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org', 'wh4f.org',
  'mailexpire.com', 'mailmoat.com', 'spamfree.eu', 'speed.1s.fr', 'filzmail.com',
  'incognitomail.com', 'incognitomail.net', 'incognitomail.org', 'jetable.org',
  'kasmail.com', 'mailcatch.com', 'mailscrap.com', 'nospam.ze.tc', 'nospamfor.us',
  'nowmymail.com', 'onewaymail.com', 'putthisinyourspamdatabase.com',
  'sendspamhere.com', 'sofimail.com', 'spambob.com', 'spambob.net', 'spambob.org',
  'spamobox.com', 'tempinbox.co.uk', 'tempm.com', 'tempemail.co.za', 'tempemail.com',
  'tempymail.com', 'thankyou2010.com', 'thisisnotmyrealemail.com', 'tradermail.info',
  'turual.com', 'twinmail.de', 'upozowac.info', 'veryrealemail.com', 'viditag.com',
  'whatpaas.com', 'whyspam.me', 'willhackforfood.biz', 'willselfdestruct.com',
  'wuzupmail.net', 'xagloo.com', 'yapped.net', 'yep.it', 'yogamaven.com',
  'yuurok.com', 'zehnminuten.de', 'zippymail.info', 'zoaxe.com',
  // More common ones
  'mailnator.com', 'mail-temp.com', 'tempemailco.com', 'fakemailgenerator.net',
  'tempail.com', 'emailtemporario.com.br', 'emailtemporar.ro', 'temp-mail.io',
  'fakemail.net', 'fakemailgenerator.com', '1secmail.com', '1secmail.net', '1secmail.org',
  'ezztt.com', 'vjuum.com', 'lroid.com', 'txcct.com', 'emlpro.com', 'emlhub.com',
  'emltmp.com', 'tmpmail.net', 'tmpmail.org', 'tmails.net', 'emailnax.com',
]);

// Free email providers
const FREE_PROVIDERS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.fr',
  'yahoo.de', 'yahoo.it', 'yahoo.es', 'yahoo.co.in', 'ymail.com',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.it',
  'outlook.com', 'outlook.co.uk', 'live.com', 'live.co.uk', 'msn.com',
  'aol.com', 'aim.com', 'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'protonmail.ch', 'proton.me', 'pm.me',
  'zoho.com', 'zohomail.com', 'mail.com', 'email.com',
  'gmx.com', 'gmx.net', 'gmx.de', 'web.de', 'freenet.de',
  'yandex.com', 'yandex.ru', 'mail.ru', 'inbox.ru', 'list.ru',
  'tutanota.com', 'tutanota.de', 'tutamail.com', 'tuta.io',
  'fastmail.com', 'fastmail.fm', 'hushmail.com', 'runbox.com',
  'rediffmail.com', 'rocketmail.com', 'att.net', 'sbcglobal.net',
  'bellsouth.net', 'cox.net', 'verizon.net', 'comcast.net',
]);

// Country calling codes with validation rules
const COUNTRY_CODES: Record<string, { code: string; length: number[]; name: string }> = {
  '+1': { code: 'US/CA', length: [10], name: 'United States/Canada' },
  '+44': { code: 'GB', length: [10, 11], name: 'United Kingdom' },
  '+91': { code: 'IN', length: [10], name: 'India' },
  '+86': { code: 'CN', length: [11], name: 'China' },
  '+81': { code: 'JP', length: [10, 11], name: 'Japan' },
  '+49': { code: 'DE', length: [10, 11, 12], name: 'Germany' },
  '+33': { code: 'FR', length: [9], name: 'France' },
  '+39': { code: 'IT', length: [9, 10], name: 'Italy' },
  '+34': { code: 'ES', length: [9], name: 'Spain' },
  '+61': { code: 'AU', length: [9], name: 'Australia' },
  '+55': { code: 'BR', length: [10, 11], name: 'Brazil' },
  '+52': { code: 'MX', length: [10], name: 'Mexico' },
  '+7': { code: 'RU', length: [10], name: 'Russia' },
  '+82': { code: 'KR', length: [9, 10], name: 'South Korea' },
  '+31': { code: 'NL', length: [9], name: 'Netherlands' },
  '+46': { code: 'SE', length: [9], name: 'Sweden' },
  '+47': { code: 'NO', length: [8], name: 'Norway' },
  '+45': { code: 'DK', length: [8], name: 'Denmark' },
  '+358': { code: 'FI', length: [9, 10], name: 'Finland' },
  '+48': { code: 'PL', length: [9], name: 'Poland' },
  '+41': { code: 'CH', length: [9], name: 'Switzerland' },
  '+43': { code: 'AT', length: [10, 11], name: 'Austria' },
  '+32': { code: 'BE', length: [9], name: 'Belgium' },
  '+351': { code: 'PT', length: [9], name: 'Portugal' },
  '+30': { code: 'GR', length: [10], name: 'Greece' },
  '+353': { code: 'IE', length: [9], name: 'Ireland' },
  '+64': { code: 'NZ', length: [9, 10], name: 'New Zealand' },
  '+65': { code: 'SG', length: [8], name: 'Singapore' },
  '+852': { code: 'HK', length: [8], name: 'Hong Kong' },
  '+886': { code: 'TW', length: [9], name: 'Taiwan' },
  '+60': { code: 'MY', length: [9, 10], name: 'Malaysia' },
  '+66': { code: 'TH', length: [9], name: 'Thailand' },
  '+62': { code: 'ID', length: [10, 11, 12], name: 'Indonesia' },
  '+63': { code: 'PH', length: [10], name: 'Philippines' },
  '+84': { code: 'VN', length: [9, 10], name: 'Vietnam' },
  '+27': { code: 'ZA', length: [9], name: 'South Africa' },
  '+234': { code: 'NG', length: [10], name: 'Nigeria' },
  '+254': { code: 'KE', length: [9], name: 'Kenya' },
  '+20': { code: 'EG', length: [10], name: 'Egypt' },
  '+971': { code: 'AE', length: [9], name: 'United Arab Emirates' },
  '+966': { code: 'SA', length: [9], name: 'Saudi Arabia' },
  '+972': { code: 'IL', length: [9], name: 'Israel' },
  '+90': { code: 'TR', length: [10], name: 'Turkey' },
  '+380': { code: 'UA', length: [9], name: 'Ukraine' },
};

// Invalid/fake number patterns
const INVALID_PHONE_PATTERNS = [
  /^(\d)\1{6,}$/,           // All same digits (1111111, 2222222)
  /^123456/,                // Sequential starting
  /^012345/,                // Sequential starting with 0
  /^0{3,}/,                 // Leading zeros
  /^1{5,}/,                 // Too many 1s
  /^555\d{4}$/,             // US fake 555 numbers (7 digits)
  /^555[0-9]{7}$/,          // US fake 555 numbers (10 digits)
  /^0000/,                  // Starting with 0000
  /^9999/,                  // Starting with 9999
  /1234567890/,             // Common test number
  /0987654321/,             // Reverse sequence
  /^(.)\1+$/,               // All same character
  /^123123/,                // Repeating pattern
  /^111222/,                // Simple pattern
  /^000000/,                // All zeros
];

// Invalid email patterns
const INVALID_EMAIL_PATTERNS = [
  /^test[@\.]?/i,           // test@, test.
  /^admin[@\.]?/i,          // admin@
  /^info[@\.]?/i,           // info@
  /^no[-_.]?reply/i,        // noreply, no-reply, no_reply
  /^support[@\.]?/i,        // support@
  /^contact[@\.]?/i,        // contact@
  /^hello[@\.]?/i,          // hello@
  /^email[@\.]?/i,          // email@
  /^sample[@\.]?/i,         // sample@
  /^example[@\.]?/i,        // example@
  /^user[@\.]?/i,           // user@
  /^demo[@\.]?/i,           // demo@
  /^fake[@\.]?/i,           // fake@
  /^null[@\.]?/i,           // null@
  /^none[@\.]?/i,           // none@
  /^na[@\.]?/i,             // na@, n/a
  /^xxx/i,                  // xxx...
  /^aaa/i,                  // aaa...
  /^asdf/i,                 // asdf (keyboard mash)
  /^qwer/i,                 // qwer (keyboard mash)
  /^zxcv/i,                 // zxcv (keyboard mash)
  /^1234/,                  // 1234...
  /(.)\1{4,}/,              // 5+ repeated chars (aaaaa, 11111)
  /^[a-z]{1,2}\d{5,}@/i,    // Single letter + many numbers (a123456@)
  /^[0-9]+@/,               // Only numbers before @
  /^.{1,2}@/,               // Only 1-2 chars before @
];

export function validatePhoneNumber(phone: string): PhoneValidationResult {
  const invalidResult = (reason: string): PhoneValidationResult => ({
    isValid: false,
    formatted: phone,
    countryCode: '',
    nationalNumber: '',
    type: 'unknown',
    isPossibleBurner: false,
    confidence: 0,
    reason,
  });

  // Clean the phone number - remove all non-digit except leading +
  const hasPlus = phone.trim().startsWith('+');
  const cleaned = phone.replace(/[^\d]/g, '');

  // Basic checks
  if (!cleaned || cleaned.length < 7) {
    return invalidResult('Phone number too short (minimum 7 digits)');
  }

  if (cleaned.length > 15) {
    return invalidResult('Phone number too long (maximum 15 digits)');
  }

  // Check for invalid patterns
  for (const pattern of INVALID_PHONE_PATTERNS) {
    if (pattern.test(cleaned)) {
      return invalidResult('Invalid phone number pattern detected');
    }
  }

  // Try to detect country code
  let countryCode = '+1'; // Default to US
  let nationalNumber = cleaned;
  let region = 'US';
  let countryInfo = COUNTRY_CODES['+1'];

  if (hasPlus || phone.startsWith('00')) {
    // International format - find matching country code
    const searchNumber = hasPlus ? cleaned : cleaned.slice(2);

    for (const [code, info] of Object.entries(COUNTRY_CODES)) {
      const codeDigits = code.replace('+', '');
      if (searchNumber.startsWith(codeDigits)) {
        countryCode = code;
        nationalNumber = searchNumber.slice(codeDigits.length);
        region = info.code;
        countryInfo = info;
        break;
      }
    }
  } else if (cleaned.startsWith('1') && cleaned.length === 11) {
    // US number with country code
    nationalNumber = cleaned.slice(1);
  }

  // Validate length for detected country
  const expectedLengths = countryInfo?.length || [10];
  if (!expectedLengths.includes(nationalNumber.length)) {
    return invalidResult(`Invalid length for ${region} number (expected ${expectedLengths.join(' or ')} digits, got ${nationalNumber.length})`);
  }

  // US-specific validation
  if (countryCode === '+1' && nationalNumber.length === 10) {
    const areaCode = nationalNumber.slice(0, 3);
    const exchange = nationalNumber.slice(3, 6);

    // Area code can't start with 0 or 1
    if (areaCode[0] === '0' || areaCode[0] === '1') {
      return invalidResult('Invalid US area code (cannot start with 0 or 1)');
    }

    // Exchange can't start with 0 or 1
    if (exchange[0] === '0' || exchange[0] === '1') {
      return invalidResult('Invalid US exchange code (cannot start with 0 or 1)');
    }

    // 555 prefix is reserved for fictional use
    if (areaCode === '555' || exchange === '555') {
      return invalidResult('555 numbers are reserved for fictional use');
    }

    // N11 codes are special (211, 311, 411, 511, 611, 711, 811, 911)
    if (/^[2-9]11$/.test(areaCode)) {
      return invalidResult('N11 codes are service numbers, not valid phone numbers');
    }
  }

  // Determine phone type and burner probability
  let phoneType: 'mobile' | 'landline' | 'voip' | 'toll_free' | 'unknown' = 'mobile';
  let isPossibleBurner = false;

  if (countryCode === '+1' && nationalNumber.length === 10) {
    const areaCode = nationalNumber.slice(0, 3);

    // Toll-free numbers
    if (['800', '888', '877', '866', '855', '844', '833'].includes(areaCode)) {
      phoneType = 'toll_free';
    }
    // Known VOIP prefixes
    else if (['500', '533', '544', '566', '577', '588'].includes(areaCode)) {
      phoneType = 'voip';
      isPossibleBurner = true;
    }
  }

  // Format the number
  let formatted = phone;
  if (countryCode === '+1' && nationalNumber.length === 10) {
    formatted = `+1 (${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6)}`;
  } else {
    formatted = `${countryCode} ${nationalNumber}`;
  }

  // Calculate confidence
  let confidence = 70; // Base confidence for valid format
  if (expectedLengths.includes(nationalNumber.length)) confidence += 15;
  if (!isPossibleBurner) confidence += 10;
  if (phoneType === 'mobile') confidence += 5;

  return {
    isValid: true,
    formatted,
    countryCode,
    nationalNumber,
    type: phoneType,
    region,
    isPossibleBurner,
    confidence: Math.min(100, confidence),
  };
}

export function validateEmail(email: string): EmailValidationResult {
  const invalidResult = (reason: string): EmailValidationResult => ({
    isValid: false,
    email: email.trim().toLowerCase(),
    domain: '',
    isDisposable: false,
    isCorporate: false,
    isFreeProvider: false,
    mxValid: false,
    confidence: 0,
    riskLevel: 'high',
    reason,
  });

  const trimmed = email.trim().toLowerCase();

  // Basic checks
  if (!trimmed) {
    return invalidResult('Email is required');
  }

  if (trimmed.length < 5) {
    return invalidResult('Email too short');
  }

  if (trimmed.length > 254) {
    return invalidResult('Email too long');
  }

  // Must have exactly one @
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount !== 1) {
    return invalidResult('Email must contain exactly one @ symbol');
  }

  // Split into local and domain parts
  const [localPart, domain] = trimmed.split('@');

  // Validate local part
  if (!localPart || localPart.length === 0) {
    return invalidResult('Email local part is missing');
  }

  if (localPart.length > 64) {
    return invalidResult('Email local part too long');
  }

  // Validate domain
  if (!domain || domain.length === 0) {
    return invalidResult('Email domain is missing');
  }

  if (!domain.includes('.')) {
    return invalidResult('Email domain must contain a dot');
  }

  // Check TLD
  const tld = domain.split('.').pop() || '';
  if (tld.length < 2) {
    return invalidResult('Invalid email TLD');
  }

  // RFC 5322 compliant regex (simplified but robust)
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return invalidResult('Invalid email format');
  }

  // Check for invalid patterns
  for (const pattern of INVALID_EMAIL_PATTERNS) {
    if (pattern.test(localPart)) {
      return invalidResult('Email appears to be fake or a placeholder');
    }
  }

  // Check for disposable email
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return invalidResult('Disposable/temporary email addresses are not allowed');
  }

  // Also check partial matches for disposable domains
  const disposableArray = Array.from(DISPOSABLE_DOMAINS);
  for (const disposable of disposableArray) {
    if (domain.endsWith('.' + disposable) || domain.includes(disposable.split('.')[0])) {
      return invalidResult('Disposable/temporary email addresses are not allowed');
    }
  }

  // Check for obviously fake domains
  if (/^(test|fake|example|sample|demo|null|void|none)\./i.test(domain)) {
    return invalidResult('Invalid email domain');
  }

  // example.com, example.org, etc. are reserved
  if (domain.startsWith('example.')) {
    return invalidResult('example.* domains are reserved and cannot receive email');
  }

  // Check if free provider
  const isFreeProvider = FREE_PROVIDERS.has(domain);
  const isCorporate = !isFreeProvider && !DISPOSABLE_DOMAINS.has(domain);

  // Determine provider
  let provider: string | undefined;
  if (domain.includes('gmail') || domain.includes('google')) provider = 'Google';
  else if (domain.includes('yahoo') || domain.includes('ymail')) provider = 'Yahoo';
  else if (domain.includes('hotmail') || domain.includes('outlook') || domain.includes('live') || domain.includes('msn')) provider = 'Microsoft';
  else if (domain.includes('icloud') || domain === 'me.com' || domain === 'mac.com') provider = 'Apple';
  else if (domain.includes('proton')) provider = 'Proton';
  else if (isCorporate) provider = 'Corporate';

  // Calculate risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (localPart.length < 4) riskLevel = 'medium';
  if (/\d{4,}/.test(localPart)) riskLevel = 'medium'; // Many numbers

  // Calculate confidence
  let confidence = 60; // Base
  if (isFreeProvider || isCorporate) confidence += 20;
  if (localPart.length >= 4) confidence += 10;
  if (!riskLevel || riskLevel === 'low') confidence += 10;

  return {
    isValid: true,
    email: trimmed,
    domain,
    isDisposable: false,
    isCorporate,
    isFreeProvider,
    mxValid: true,
    confidence: Math.min(100, confidence),
    provider,
    riskLevel,
  };
}

// Combined validation for form submission
export interface FormValidationResult {
  isValid: boolean;
  phone: PhoneValidationResult;
  email: EmailValidationResult;
  overallRisk: 'low' | 'medium' | 'high';
  overallConfidence: number;
  warnings: string[];
}

export function validateFormContact(phone: string, email: string): FormValidationResult {
  const phoneResult = validatePhoneNumber(phone);
  const emailResult = validateEmail(email);

  const warnings: string[] = [];

  if (!phoneResult.isValid) {
    warnings.push(phoneResult.reason || 'Invalid phone number format');
  }
  if (phoneResult.isPossibleBurner) {
    warnings.push('Phone number may be a burner/VOIP');
  }
  if (phoneResult.type === 'voip') {
    warnings.push('VOIP number detected');
  }

  if (!emailResult.isValid) {
    warnings.push(emailResult.reason || 'Invalid or suspicious email');
  }
  if (emailResult.isDisposable) {
    warnings.push('Disposable email detected');
  }
  if (emailResult.riskLevel === 'high') {
    warnings.push('High-risk email pattern');
  }

  // Calculate overall risk
  let overallRisk: 'low' | 'medium' | 'high' = 'low';
  if (!phoneResult.isValid || !emailResult.isValid) {
    overallRisk = 'high';
  } else if (emailResult.riskLevel === 'medium' || phoneResult.isPossibleBurner) {
    overallRisk = 'medium';
  }

  // Calculate overall confidence
  const overallConfidence = phoneResult.isValid && emailResult.isValid
    ? Math.round((phoneResult.confidence + emailResult.confidence) / 2)
    : 0;

  return {
    isValid: phoneResult.isValid && emailResult.isValid,
    phone: phoneResult,
    email: emailResult,
    overallRisk,
    overallConfidence,
    warnings,
  };
}
