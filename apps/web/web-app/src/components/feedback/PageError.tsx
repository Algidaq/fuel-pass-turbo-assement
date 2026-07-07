import { Alert, Button } from '@fuel-pass/ui';

type PageErrorProps = {
    message: string;
    onRetry?: () => void;
};

export const PageError = ({ message, onRetry }: PageErrorProps) => (
    <Alert className="page-error" role="alert" variant="danger">
        <span>{message}</span>
        {onRetry ? (
            <Button onClick={onRetry} size="sm" type="button" variant="secondary">
                Try again
            </Button>
        ) : null}
    </Alert>
);
