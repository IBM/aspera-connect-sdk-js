import { dict } from './language';

describe('Language', () => {
  describe('get', () => {
    it('should return a string', () => {
      expect(dict.get('running')).toBe('IBM Aspera Connect is running!');
    });

    it('should return an empty string if no key', () => {
      expect(dict.get('asdf')).toBe('');
    });
  });

  describe('findClosestLanguage', () => {
    const testCodes = [
      {
        given: 'en',
        expected: 'en-us'
      },
      {
        given: 'en-us',
        expected: 'en-us'
      },
      {
        given: 'en-US',
        expected: 'en-us'
      },
      {
        given: 'en-ca',
        expected: 'en-us'
      },
      {
        given: 'blah',
        expected: 'en-us'
      },
      {
        given: 'es',
        expected: 'es-es'
      },
      {
        given: 'es-es',
        expected: 'es-es'
      },
      {
        given: 'es-ES',
        expected: 'es-es'
      },
      {
        given: 'ko',
        expected: 'ko-kr'
      },
      {
        given: 'ko-kr',
        expected: 'ko-kr'
      },
      {
        given: 'ja',
        expected: 'ja-jp'
      },
      {
        given: 'ja-jp',
        expected: 'ja-jp'
      },
      {
        given: 'fr',
        expected: 'fr-fr'
      },
      {
        given: 'fr-fr',
        expected: 'fr-fr'
      },
      {
        given: 'zh',
        expected: 'zh-cn'
      },
      {
        given: 'zh-cn',
        expected: 'zh-cn'
      },
      {
        given: 'zh-hk',
        expected: 'zh-cn'
      },
      {
        given: null,
        expected: 'en-us'
      },
      {
        given: undefined,
        expected: 'en-us'
      },
      {
        given: '',
        expected: 'en-us'
      }
    ];

    testCodes.forEach(item => {
      it(`should return ${item.expected} for code ${item.given}`, () => {
        expect(dict.findClosestLanguage(item.given)).toBe(item.expected);
      });
    });
  });

  describe('getCurrentLanguage', () => {
    it('should set language to english', () => {
      expect(dict.getCurrentLanguage().code).toBe('en');
    });
  });
});
