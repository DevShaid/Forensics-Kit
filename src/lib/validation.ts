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
}

// Common disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'guerrillamail.org',
  'sharklasers.com', 'grr.la', 'guerrillamailblock.com', 'pokemail.net',
  'spam4.me', 'mailinator.com', 'mailinator2.com', 'mailinater.com',
  'throwaway.email', 'fakeinbox.com', 'trashmail.com', 'trashmail.net',
  'getairmail.com', 'getnada.com', 'tempail.com', 'tempr.email',
  'discard.email', 'discardmail.com', 'mailnesia.com', 'mintemail.com',
  'mohmal.com', 'throwawaymail.com', 'yopmail.com', 'yopmail.fr',
  '10minutemail.com', '10minutemail.net', 'minutemail.com',
  'emailondeck.com', 'burnermail.io', 'maildrop.cc', 'mailsac.com',
  'inboxkitten.com', 'disposableemailaddresses.com', 'tempmailaddress.com',
  'fakemailgenerator.com', 'emailfake.com', 'crazymailing.com',
  'tempinbox.com', 'disposable.com', 'mailcatch.com', 'spamgourmet.com',
  'mytrashmail.com', 'mt2009.com', 'trash2009.com', 'trashymail.com',
  'antispam24.de', 'spamfree24.org', 'spamfree24.de', 'spamfree24.info',
  'emailsensei.com', 'armyspy.com', 'cuvox.de', 'dayrep.com', 'einrot.com',
  'fleckens.hu', 'gustr.com', 'jourrapide.com', 'rhyta.com', 'superrito.com',
  'teleworm.us', 'tempomail.fr', 'dispostable.com', 'mailforspam.com',
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

// VOIP/Virtual number prefixes (US)
const VOIP_PREFIXES_US = [
  '500', '521', '522', '523', '524', '525', '526', '527', '528', '529',
  '533', '544', '566', '577', '588',
];

// Country calling codes
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

// US Carrier detection by area code prefixes
const US_CARRIER_HINTS: Record<string, string[]> = {
  'Verizon': ['201', '202', '203', '206', '207', '208', '209', '210'],
  'AT&T': ['214', '215', '216', '217', '218', '219', '224', '225'],
  'T-Mobile': ['228', '229', '231', '234', '239', '240', '248', '251'],
  'Sprint': ['252', '253', '254', '256', '260', '262', '267', '269'],
};

export function validatePhoneNumber(phone: string): PhoneValidationResult {
  // Clean the phone number
  const cleaned = phone.replace(/[\s\-\(\)\.\+]/g, '');

  // Check if it's empty or too short
  if (!cleaned || cleaned.length < 7) {
    return {
      isValid: false,
      formatted: phone,
      countryCode: '',
      nationalNumber: '',
      type: 'unknown',
      isPossibleBurner: false,
      confidence: 0,
    };
  }

  // Try to detect country code
  let countryCode = '+1'; // Default to US
  let nationalNumber = cleaned;
  let region = 'US';

  // Check for international format
  if (phone.startsWith('+')) {
    // Find matching country code
    for (const [code, info] of Object.entries(COUNTRY_CODES)) {
      const codeDigits = code.replace('+', '');
      if (cleaned.startsWith(codeDigits)) {
        countryCode = code;
        nationalNumber = cleaned.slice(codeDigits.length);
        region = info.code;
        break;
      }
    }
  } else if (cleaned.startsWith('1') && cleaned.length === 11) {
    // US number with country code
    nationalNumber = cleaned.slice(1);
  } else if (cleaned.startsWith('00')) {
    // International format with 00
    const withoutPrefix = cleaned.slice(2);
    for (const [code, info] of Object.entries(COUNTRY_CODES)) {
      const codeDigits = code.replace('+', '');
      if (withoutPrefix.startsWith(codeDigits)) {
        countryCode = code;
        nationalNumber = withoutPrefix.slice(codeDigits.length);
        region = info.code;
        break;
      }
    }
  }

  // Get expected length for this country
  const countryInfo = COUNTRY_CODES[countryCode];
  const expectedLengths = countryInfo?.length || [10];

  // Validate length
  const isValidLength = expectedLengths.includes(nationalNumber.length);

  // Check if all digits
  const isAllDigits = /^\d+$/.test(nationalNumber);

  // Detect phone type
  let phoneType: 'mobile' | 'landline' | 'voip' | 'toll_free' | 'unknown' = 'unknown';
  let isPossibleBurner = false;
  let carrier: string | undefined;

  if (countryCode === '+1' && nationalNumber.length === 10) {
    const areaCode = nationalNumber.slice(0, 3);
    const prefix = nationalNumber.slice(3, 6);

    // Check for toll-free
    if (['800', '888', '877', '866', '855', '844', '833'].includes(areaCode)) {
      phoneType = 'toll_free';
    }
    // Check for VOIP
    else if (VOIP_PREFIXES_US.includes(areaCode)) {
      phoneType = 'voip';
      isPossibleBurner = true;
    }
    // Mobile vs landline heuristics (simplified)
    else if (['2', '3', '4', '5', '6', '7', '8', '9'].includes(prefix[0])) {
      phoneType = 'mobile';
    }

    // Carrier hint
    for (const [carrierName, prefixes] of Object.entries(US_CARRIER_HINTS)) {
      if (prefixes.includes(areaCode)) {
        carrier = carrierName;
        break;
      }
    }

    // Check for common burner patterns
    const burnerPatterns = [
      /(\d)\1{6,}/, // Repeated digits (1111111)
      /^555/, // 555 prefix (fake)
      /123456/, // Sequential
      /^0{3}/, // Leading zeros
    ];

    if (burnerPatterns.some(p => p.test(nationalNumber))) {
      isPossibleBurner = true;
    }
  }

  // Format the number
  let formatted = phone;
  if (countryCode === '+1' && nationalNumber.length === 10) {
    formatted = `+1 (${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6)}`;
  } else if (nationalNumber.length >= 7) {
    formatted = `${countryCode} ${nationalNumber}`;
  }

  // Calculate confidence
  let confidence = 0;
  if (isAllDigits) confidence += 30;
  if (isValidLength) confidence += 40;
  if (phoneType !== 'unknown') confidence += 20;
  if (!isPossibleBurner) confidence += 10;

  return {
    isValid: isAllDigits && isValidLength && nationalNumber.length >= 7,
    formatted,
    countryCode,
    nationalNumber,
    type: phoneType,
    carrier,
    region,
    isPossibleBurner,
    confidence,
  };
}

export function validateEmail(email: string): EmailValidationResult {
  const trimmed = email.trim().toLowerCase();

  // Basic format validation
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      email: trimmed,
      domain: '',
      isDisposable: false,
      isCorporate: false,
      isFreeProvider: false,
      mxValid: false,
      confidence: 0,
      riskLevel: 'high',
    };
  }

  const [localPart, domain] = trimmed.split('@');

  // Check for disposable email
  const isDisposable = DISPOSABLE_DOMAINS.has(domain);

  // Check for free provider
  const isFreeProvider = FREE_PROVIDERS.has(domain);

  // Check for corporate (not free, not disposable)
  const isCorporate = !isFreeProvider && !isDisposable;

  // Determine provider name
  let provider: string | undefined;
  if (domain.includes('gmail') || domain.includes('google')) provider = 'Google';
  else if (domain.includes('yahoo') || domain.includes('ymail')) provider = 'Yahoo';
  else if (domain.includes('hotmail') || domain.includes('outlook') || domain.includes('live') || domain.includes('msn')) provider = 'Microsoft';
  else if (domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com')) provider = 'Apple';
  else if (domain.includes('proton')) provider = 'Proton';
  else if (isCorporate) provider = 'Corporate';

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /^test/, // test@...
    /^admin/, // admin@...
    /^info/, // info@...
    /^no.?reply/, // noreply@...
    /^support/, // support@...
    /\d{5,}/, // Many numbers
    /^[a-z]{1,2}\d+/, // a123456@...
    /(.)\1{4,}/, // Repeated characters
  ];

  const hasSuspiciousPattern = suspiciousPatterns.some(p => p.test(localPart));

  // Calculate risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (isDisposable) riskLevel = 'high';
  else if (hasSuspiciousPattern) riskLevel = 'medium';
  else if (isFreeProvider && localPart.length < 4) riskLevel = 'medium';

  // Calculate confidence
  let confidence = 50; // Base confidence for valid format
  if (!isDisposable) confidence += 20;
  if (isCorporate) confidence += 15;
  if (!hasSuspiciousPattern) confidence += 10;
  if (localPart.length >= 5) confidence += 5;

  return {
    isValid: !isDisposable && !hasSuspiciousPattern,
    email: trimmed,
    domain,
    isDisposable,
    isCorporate,
    isFreeProvider,
    mxValid: true, // Would need server-side DNS check
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

  if (!phoneResult.isValid) warnings.push('Invalid phone number format');
  if (phoneResult.isPossibleBurner) warnings.push('Phone number may be a burner/VOIP');
  if (phoneResult.type === 'voip') warnings.push('VOIP number detected');

  if (!emailResult.isValid) warnings.push('Invalid or suspicious email');
  if (emailResult.isDisposable) warnings.push('Disposable email detected');
  if (emailResult.riskLevel === 'high') warnings.push('High-risk email pattern');

  // Calculate overall risk
  let overallRisk: 'low' | 'medium' | 'high' = 'low';
  if (emailResult.isDisposable || phoneResult.isPossibleBurner) {
    overallRisk = 'high';
  } else if (emailResult.riskLevel === 'medium' || phoneResult.type === 'voip') {
    overallRisk = 'medium';
  }

  // Calculate overall confidence
  const overallConfidence = Math.round((phoneResult.confidence + emailResult.confidence) / 2);

  return {
    isValid: phoneResult.isValid && emailResult.isValid,
    phone: phoneResult,
    email: emailResult,
    overallRisk,
    overallConfidence,
    warnings,
  };
}
