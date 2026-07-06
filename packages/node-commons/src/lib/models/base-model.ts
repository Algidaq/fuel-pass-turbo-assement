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
