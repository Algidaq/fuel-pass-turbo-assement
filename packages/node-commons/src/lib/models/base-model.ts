import type { ClassParams } from '../helpers';

export abstract class BaseModel<T> {
    public constructor(params?: Partial<ClassParams<T>>) {
        if (!params) {
            return;
        }

        Object.assign(this, params);
    }

    public abstract copyWith(params: Partial<ClassParams<T>>): T;
}

export abstract class BaseResModel<T> extends BaseModel<T> {
    public toJSON(): Record<string, any> {
        return this;
    }
}
