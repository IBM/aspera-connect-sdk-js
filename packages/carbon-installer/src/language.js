import Dictionary from './constants';

class LanguageService {
  constructor() {
    this.availableLanguages = {
      'en-us': {
        name: 'English (US)',
        dictionary: Dictionary.enUS,
        code: 'en'
      },
      'es-es': {
        name: 'Español (España)',
        dictionary: Dictionary.esES,
        code: 'es'
      },
      'fr-fr': {
        name: 'Français (France)',
        dictionary: Dictionary.frFR,
        code: 'fr'
      },
      'ja-jp': {
        name: '日本語 (日本)',
        dictionary: Dictionary.jaJP,
        code: 'ja'
      },
      'ko-kr': {
        name: '한국어 (대한민국)',
        dictionary: Dictionary.koKR,
        code: 'ko'
      },
      'zh-cn': {
        name: '简体中文',
        dictionary: Dictionary.zhCN,
        code: 'zh'
      }
    };
    this.languageToUse = this.findClosestLanguage(
      this.getBrowserLanguage() ||
      this.defaultLanguage()
    );
    this.currentLanguage = this.availableLanguages[this.languageToUse];
    this.dictionary = this.currentLanguage.dictionary
  }
  
  defaultLanguage() {
    console.log('Defaulting to English (US).');
    return 'en-us'
  }
  
  // If no dictionary matches exactly (en-ca), find the first dictionary that 
  // matches the language code (en).
  findClosestLanguage(lang) {
    if (this.availableLanguages[lang]) {
      return lang;
    } else {
      if (lang) {
        const langCode = lang.split('-')[0];
        const closeLanguages = Object.keys(this.availableLanguages).filter(key => {
          return key.indexOf(`${langCode}-`) > -1;
        });
        return closeLanguages[0] || this.defaultLanguage();
      } else {
        return this.defaultLanguage();
      }
    }
  }
  
  get(key) {
    if (!this.currentLanguage) {
      console.log('Dictionary not loaded.');
      return key;
    }
    
    let result = this.dictionary[key] || Dictionary.enUS[key];
    if (!result) {
      console.log(`Could not find ${key} in any language.`);
      return '';
    }
    
    return result;
  }
  
  getBrowserLanguage() {
    if (navigator && typeof navigator.language === 'string') {
      console.log(`Detected browser language: ${navigator.language.toLowerCase()}`)
      return navigator.language.toLowerCase();
    } else {
      console.log('Could not detect browser language. Defaulting to English (US).');
    }
  }
  
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  getCurrentLanguageCode() {
    return this.currentLanguage.code;
  }
}

export const dict = new LanguageService();