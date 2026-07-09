type ClassValue = string | number | false | null | undefined | ClassValue[] | Record<string, boolean | null | undefined>;

export const cn = (...classes: ClassValue[]): string => {
    const resolved: string[] = [];

    const append = (value: ClassValue): void => {
        if (!value) {
            return;
        }

        if (typeof value === 'string' || typeof value === 'number') {
            resolved.push(String(value));
            return;
        }

        if (Array.isArray(value)) {
            value.forEach(append);
            return;
        }

        Object.entries(value).forEach(([className, enabled]) => {
            if (enabled) {
                resolved.push(className);
            }
        });
    };

    classes.forEach(append);

    return resolved.join(' ');
};
