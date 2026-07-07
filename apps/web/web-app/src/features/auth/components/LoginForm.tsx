import { Alert, Button, FormField, Input } from '@fuel-pass/ui';
import { useState, type FormEvent } from 'react';

import { loginReqDtoSchema, type TLoginRequestDto } from '@fuel-pass/contracts';
import { isApiError } from '../../../services/httpClient';

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
        return error.message;
    }

    return 'Unable to sign in. Check your credentials and try again.';
};

export const LoginForm = ({ error, isSubmitting, onSubmit }: LoginFormProps) => {
    const [values, setValues] = useState<TLoginRequestDto>({ email: '', password: '' });
    const [errors, setErrors] = useState<LoginFormErrors>({});

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
        <form className="auth-form" noValidate onSubmit={handleSubmit}>
            {error ? (
                <Alert role="alert" variant="danger">
                    {getErrorMessage(error)}
                </Alert>
            ) : null}

            <FormField error={errors.email} label="Email" required>
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

            <FormField error={errors.password} label="Password" required>
                <Input
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    error={Boolean(errors.password)}
                    name="password"
                    onChange={(event) => setValues((currentValues) => ({ ...currentValues, password: event.target.value }))}
                    placeholder="Enter your password"
                    type="password"
                    value={values.password}
                />
            </FormField>

            <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
        </form>
    );
};
