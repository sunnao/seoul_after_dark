import { Link } from 'react-router-dom';

interface ApiErrorProps {
  message: string;
  linkTo?: string;
  linkText?: string;
}

export const ApiErrorAlert = ({ message, linkTo, linkText }: ApiErrorProps) => {
  if (!message) return null;

  return (
    <div className="mb-3 alert flex w-70 justify-between alert-error">
      <span>{message}</span>
      {linkTo && linkText && (
        <Link to={linkTo} className="link font-bold link-hover">
          {linkText}
        </Link>
      )}
    </div>
  );
};
