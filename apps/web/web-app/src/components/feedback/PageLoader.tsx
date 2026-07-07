import styles from './PageLoader.module.css';

type PageLoaderProps = {
    message?: string;
    className?: string;
};

export const PageLoader = ({ className, message = 'Loading...' }: PageLoaderProps) => (
    <div className={[styles.loader, className].filter(Boolean).join(' ')} role="status">
        {message}
    </div>
);
