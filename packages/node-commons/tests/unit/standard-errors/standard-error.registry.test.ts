import { StandardErrorRegistry, type ErrorCatalog } from '../../../src';

const catalog: ErrorCatalog = {
    One: {
        code: 'TEST.ONE',
        message: 'One failed',
        description: 'First failure',
    },
    Many: [
        {
            code: 'TEST.MANY_ONE',
            message: 'Many one failed',
        },
        {
            code: 'TEST.MANY_TWO',
            message: 'Many two failed',
        },
    ],
};

describe('StandardErrorRegistry', () => {
    it('resolves registered single and multiple error definitions', () => {
        const registry = new StandardErrorRegistry();
        registry.register('test', catalog);

        expect(registry.resolve('test', 'One')).toEqual({
            code: 'TEST.ONE',
            message: 'One failed',
            description: 'First failure',
        });
        expect(registry.resolve('test', 'Many')).toEqual([
            {
                code: 'TEST.MANY_ONE',
                message: 'Many one failed',
                description: 'Many one failed',
            },
            {
                code: 'TEST.MANY_TWO',
                message: 'Many two failed',
                description: 'Many two failed',
            },
        ]);
    });

    it('rejects duplicate mappings', () => {
        const registry = new StandardErrorRegistry();
        registry.register('test', catalog);

        expect(() => registry.register('test', catalog)).toThrow('Duplicate error mapping registered: test.One');
    });

    it('uses fallback object values for unknown mappings', () => {
        const registry = new StandardErrorRegistry();

        expect(
            registry.resolve('test', 'Unknown', {
                code: 'FALLBACK.CODE',
                message: 'Fallback message',
                description: 'Fallback description',
                ignored: 123,
            })
        ).toEqual({
            code: 'FALLBACK.CODE',
            message: 'Fallback message',
            description: 'Fallback description',
        });
    });
});
