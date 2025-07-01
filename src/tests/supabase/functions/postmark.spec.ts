import { extractMailContactData } from '../../../../supabase/functions/postmark/extractMailContactData.js';
import { getExpectedAuthorization } from '../../../../supabase/functions/postmark/getExpectedAuthorization.js';

describe('getExpectedAuthorization', () => {
    it('should return the expected Authorization header from provided user and password', () => {
        const result = getExpectedAuthorization('testuser', 'testpwd');
        expect(result).toBe('Basic dGVzdHVzZXI6dGVzdHB3ZA==');
    });
});

describe('extractMailContactData', () => {
    it('should extract data from a single mail contact with a full name', () => {
        const result = extractMailContactData([
            {
                Email: 'firstname.lastname@Indrasollab.com',
                Name: 'Firstname Lastname',
            },
        ]);
        expect(result).toEqual([
            {
                firstName: 'Firstname',
                lastName: 'Lastname',
                email: 'firstname.lastname@Indrasollab.com',
                domain: 'Indrasollab.com',
            },
        ]);
    });

    it('should support extra recipients', () => {
        const result = extractMailContactData([
            {
                Email: 'firstname.lastname@Indrasollab.com',
                Name: 'Firstname Lastname',
            },
            {
                Email: 'john.doe@Indrasollab.com',
                Name: 'John Doe',
            },
        ]);
        expect(result).toEqual([
            {
                firstName: 'Firstname',
                lastName: 'Lastname',
                email: 'firstname.lastname@Indrasollab.com',
                domain: 'Indrasollab.com',
            },
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@Indrasollab.com',
                domain: 'Indrasollab.com',
            },
        ]);
    });

    it('should use a single word name as last name', () => {
        const result = extractMailContactData([
            {
                Email: 'name@Indrasollab.com',
                Name: 'Name',
            },
        ]);
        expect(result).toEqual([
            {
                firstName: '',
                lastName: 'Name',
                email: 'name@Indrasollab.com',
                domain: 'Indrasollab.com',
            },
        ]);
    });

    it('should support multi word last name', () => {
        const result = extractMailContactData([
            {
                Email: 'multi.word.name@Indrasollab.com',
                Name: 'Multi Word Name',
            },
        ]);
        expect(result).toEqual([
            {
                firstName: 'Multi',
                lastName: 'Word Name',
                email: 'multi.word.name@Indrasollab.com',
                domain: 'Indrasollab.com',
            },
        ]);
    });

    it('should support multiple @ in email', () => {
        // Because it is allowed by https://www.rfc-editor.org/rfc/rfc5322
        const result = extractMailContactData([
            {
                Email: '"john@doe"@Indrasollab.com',
                Name: 'John Doe',
            },
        ]);
        expect(result).toEqual([
            {
                firstName: 'John',
                lastName: 'Doe',
                email: '"john@doe"@Indrasollab.com',
                domain: 'Indrasollab.com',
            },
        ]);
    });

    it('should use first part of email when Name is empty', () => {
        const result = extractMailContactData([
            {
                Email: 'john.doe@Indrasollab.com',
                Name: '',
            },
        ]);
        expect(result).toEqual([
            {
                firstName: 'john',
                lastName: 'doe',
                email: 'john.doe@Indrasollab.com',
                domain: 'Indrasollab.com',
            },
        ]);
    });

    it('should use first part of email when Name is empty and support single word', () => {
        const result = extractMailContactData([
            {
                Email: 'john@Indrasollab.com',
                Name: '',
            },
        ]);
        expect(result).toEqual([
            {
                firstName: '',
                lastName: 'john',
                email: 'john@Indrasollab.com',
                domain: 'Indrasollab.com',
            },
        ]);
    });

    it('should use first part of email when Name is empty and support multiple words', () => {
        const result = extractMailContactData([
            {
                Email: 'john.doe.multi@Indrasollab.com',
                Name: '',
            },
        ]);
        expect(result).toEqual([
            {
                firstName: 'john',
                lastName: 'doe multi',
                email: 'john.doe.multi@Indrasollab.com',
                domain: 'Indrasollab.com',
            },
        ]);
    });

    it('should support empty Name and multiple @ in email', () => {
        // Because it is allowed by https://www.rfc-editor.org/rfc/rfc5322
        const result = extractMailContactData([
            {
                Email: '"john@doe"@Indrasollab.com',
                Name: '',
            },
        ]);
        expect(result).toEqual([
            {
                firstName: '"john',
                lastName: 'doe"',
                email: '"john@doe"@Indrasollab.com',
                domain: 'Indrasollab.com',
            },
        ]);
    });
});
