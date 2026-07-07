type PageLoaderProps = {
    message?: string;
};

export const PageLoader = ({ message = 'Loading...' }: PageLoaderProps) => (
    <div className="page-loader" role="status">
        {message}
    </div>
);
