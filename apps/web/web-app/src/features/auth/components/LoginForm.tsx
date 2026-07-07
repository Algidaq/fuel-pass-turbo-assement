import { Alert, Button, FormField, Input } from '@fuel-pass/ui';
import { useState, type FormEvent } from 'react';

import { loginReqDtoSchema, type TLoginRequestDto } from '@fuel-pass/contracts';
import { getApiErrorMessage } from '../../../services/apiErrorMessages';
import { isApiError } from '../../../services/httpClient';
import styles from './LoginForm.module.css';

type LoginFormProps = {
    error?: unknown;
    isSubmitting: boolean;
    onSubmit: (request: TLoginRequestDto) => Promise<void>;
};

const loginValidationSchema = loginReqDtoSchema.pick({ email: true, password: true });

type LoginFormErrors = Partial<Record<keyof TLoginRequestDto, string>>;

const validateForm = (values: TLoginRequestDto): LoginFormErrors => {
    const result = loginValidationSchema.safeParse(values);
    if (result.success) {
        return {};
    }
    const formattedError = result.error.format();
    return {
        email: formattedError.email?._errors.at(0),
        password: formattedError.password?._errors.at(0),
    };
};

const getErrorMessage = (error: unknown): string => {
    if (isApiError(error)) {
        if (error.status === 401) {
            return 'Invalid email or password.';
        }

        return getApiErrorMessage(error, 'Unable to sign in. Check your credentials and try again.');
    }

    return 'Unable to sign in. Check your credentials and try again.';
};

export const LoginForm = ({ error, isSubmitting, onSubmit }: LoginFormProps) => {
    const [values, setValues] = useState<TLoginRequestDto>({ email: '', password: '' });
    const [errors, setErrors] = useState<LoginFormErrors>({});
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextErrors = validateForm(values);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        try {
            await onSubmit({
                email: values.email.trim(),
                password: values.password,
            });
        } catch {
            setValues((currentValues) => ({ ...currentValues, password: '' }));
        }
    };

    return (
        <form className={styles.form} noValidate onSubmit={handleSubmit}>
            {error ? (
                <Alert role="alert" variant="danger">
                    {getErrorMessage(error)}
                </Alert>
            ) : null}

            <FormField error={errors.email} label="Email">
                <Input
                    autoComplete="email"
                    disabled={isSubmitting}
                    error={Boolean(errors.email)}
                    name="email"
                    onChange={(event) => setValues((currentValues) => ({ ...currentValues, email: event.target.value }))}
                    placeholder="name@company.com"
                    type="email"
                    value={values.email}
                />
            </FormField>

            <FormField
                error={errors.password}
                label={
                    <span className={styles.passwordLabel}>
                        <span>Password</span>
                        <button
                            className={styles.passwordToggle}
                            disabled={isSubmitting}
                            onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
                            type="button"
                        >
                            {isPasswordVisible ? 'Hide' : 'Show'}
                        </button>
                    </span>
                }
            >
                <Input
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    error={Boolean(errors.password)}
                    name="password"
                    onChange={(event) => setValues((currentValues) => ({ ...currentValues, password: event.target.value }))}
                    placeholder="Enter your password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={values.password}
                />
            </FormField>

            <Button disabled={isSubmitting} size="lg" type="submit">
                {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
        </form>
    );
};
