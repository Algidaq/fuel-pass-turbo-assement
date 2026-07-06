import type { LoginRequestDto } from '../../src';

describe('contracts', () => {
    it('exports auth contracts', () => {
        const request: LoginRequestDto = {
            email: 'manager@fuelpass.test',
            password: 'Password123!',
        };

        expect(request.email).toEqual('manager@fuelpass.test');
    });
});
